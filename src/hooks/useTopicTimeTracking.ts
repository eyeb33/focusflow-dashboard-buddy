import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TimerSession {
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  mode: 'pomodoro' | 'free';
  totalSeconds: number;
}

export interface TopicTimeSegment {
  id: string;
  timerSessionId: string;
  topicId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
}

interface TopicTimeState {
  currentTimerSessionId: string | null;
  currentTopicId: string | null;
  currentSegmentId: string | null;
  isTimerRunning: boolean;
  pausedDuration: number; // Track time spent paused to subtract from total
}

export const useTopicTimeTracking = () => {
  const { user } = useAuth();
  
  // Core state
  const [state, setState] = useState<TopicTimeState>({
    currentTimerSessionId: null,
    currentTopicId: null,
    currentSegmentId: null,
    isTimerRunning: false,
    pausedDuration: 0,
  });
  
  // Track aggregate time per topic (for display)
  const [topicTotalTimes, setTopicTotalTimes] = useState<Record<string, number>>({});
  
  // Live elapsed time that updates every second for reactive UI
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState(0);
  
  // Refs for tracking elapsed time in current segment
  const pauseStartTimeRef = useRef<number | null>(null);
  const segmentStartTimeRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);
  
  // Update live elapsed time every second when timer is running
  useEffect(() => {
    if (state.isTimerRunning && segmentStartTimeRef.current) {
      const updateElapsed = () => {
        const elapsed = Math.floor((Date.now() - (segmentStartTimeRef.current || 0)) / 1000);
        setLiveElapsedSeconds(elapsed);
      };
      
      // Initial update
      updateElapsed();
      
      // Update every second
      const interval = setInterval(updateElapsed, 1000);
      
      return () => clearInterval(interval);
    } else {
      setLiveElapsedSeconds(0);
    }
  }, [state.isTimerRunning]);

  // Fetch aggregate times for all topics
  const fetchTopicTotalTimes = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('topic_time_segments')
        .select('topic_id, duration_seconds')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Aggregate by topic
      const totals: Record<string, number> = {};
      (data || []).forEach(segment => {
        const topicId = segment.topic_id;
        totals[topicId] = (totals[topicId] || 0) + (segment.duration_seconds || 0);
      });
      
      setTopicTotalTimes(totals);
    } catch (error) {
      console.error('Error fetching topic total times:', error);
    }
  }, [user]);

  // Restore state on mount (check for open sessions/segments)
  const restoreState = useCallback(async () => {
    if (!user) return;
    
    try {
      // Find open timer session
      const { data: openSession, error: sessionError } = await supabase
        .from('timer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .maybeSingle();
      
      if (sessionError) throw sessionError;
      
      if (openSession) {
        // Find open segment in this session
        const { data: openSegment, error: segmentError } = await supabase
          .from('topic_time_segments')
          .select('*')
          .eq('timer_session_id', openSession.id)
          .is('ended_at', null)
          .maybeSingle();
        
        if (segmentError) throw segmentError;
        
        setState({
          currentTimerSessionId: openSession.id,
          currentTopicId: openSegment?.topic_id || null,
          pausedDuration: 0,
          currentSegmentId: openSegment?.id || null,
          isTimerRunning: !!openSegment, // Timer is running if there's an open segment
        });
        
        if (openSegment) {
          segmentStartTimeRef.current = new Date(openSegment.started_at).getTime();
        }
      }
    } catch (error) {
      console.error('Error restoring time tracking state:', error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      restoreState();
      fetchTopicTotalTimes();
    }
  }, [user, restoreState, fetchTopicTotalTimes]);

  // Start timer with a topic
  const startTimer = useCallback(async (topicId: string, mode: 'pomodoro' | 'free' = 'pomodoro') => {
    if (!user) return null;
    
    try {
      // Close any existing open segments first (safety)
      // Use direct update instead of RPC for compatibility
      await supabase
        .from('topic_time_segments')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: 0, // Will be recalculated on next use
        })
        .eq('user_id', user.id)
        .is('ended_at', null);
      
      // Create or reuse timer session
      let sessionId = state.currentTimerSessionId;
      
      if (!sessionId) {
        // Create new timer session
        const { data: newSession, error: sessionError } = await supabase
          .from('timer_sessions')
          .insert({
            user_id: user.id,
            mode,
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single();
        
        if (sessionError) throw sessionError;
        sessionId = newSession.id;
      }
      
      // Create new segment for this topic
      const now = new Date().toISOString();
      const { data: newSegment, error: segmentError } = await supabase
        .from('topic_time_segments')
        .insert({
          timer_session_id: sessionId,
          topic_id: topicId,
          user_id: user.id,
          started_at: now,
        })
        .select('id')
        .single();
      
      if (segmentError) throw segmentError;
      
      segmentStartTimeRef.current = Date.now();
      
      setState({
        currentTimerSessionId: sessionId,
        currentTopicId: topicId,
        pausedDuration: 0,
        currentSegmentId: newSegment.id,
        isTimerRunning: true,
      });
      
      return { sessionId, segmentId: newSegment.id };
    } catch (error) {
      console.error('Error starting timer:', error);
      return null;
    }
  }, [user, state.currentTimerSessionId]);

  // Close current segment (internal helper) - now accounts for paused time
  const closeCurrentSegment = useCallback(async (): Promise<number> => {
    if (!state.currentSegmentId || !segmentStartTimeRef.current) return 0;
    
    const now = Date.now();
    const totalElapsed = Math.floor((now - segmentStartTimeRef.current) / 1000);
    // Subtract any time spent paused
    const durationSeconds = Math.max(0, totalElapsed - state.pausedDuration);
    
    try {
      const { error } = await supabase
        .from('topic_time_segments')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', state.currentSegmentId);
      
      if (error) throw error;
      
      // Update local totals
      if (state.currentTopicId) {
        setTopicTotalTimes(prev => ({
          ...prev,
          [state.currentTopicId!]: (prev[state.currentTopicId!] || 0) + durationSeconds,
        }));
      }
      
      return durationSeconds;
    } catch (error) {
      console.error('Error closing segment:', error);
      return 0;
    }
  }, [state.currentSegmentId, state.currentTopicId, state.pausedDuration]);

  // Switch topic while timer is running
  const switchTopic = useCallback(async (newTopicId: string) => {
    if (!user || !state.currentTimerSessionId) return;
    
    // If timer is running, close current segment and open new one
    if (state.isTimerRunning && state.currentSegmentId) {
      await closeCurrentSegment();
      
      // Create new segment for the new topic
      const now = new Date().toISOString();
      const { data: newSegment, error } = await supabase
        .from('topic_time_segments')
        .insert({
          timer_session_id: state.currentTimerSessionId,
          topic_id: newTopicId,
          user_id: user.id,
          started_at: now,
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating new segment:', error);
        return;
      }
      
      segmentStartTimeRef.current = Date.now();
      
      setState(prev => ({
        ...prev,
        currentTopicId: newTopicId,
        currentSegmentId: newSegment.id,
        pausedDuration: 0, // Reset paused duration for new segment
      }));
    } else {
      // Timer is paused - just update the topic reference
      // Next resume will create a new segment for this topic
      setState(prev => ({
        ...prev,
        currentTopicId: newTopicId,
      }));
    }
  }, [user, state.currentTimerSessionId, state.isTimerRunning, state.currentSegmentId, closeCurrentSegment]);

  // Pause timer - keep segment open, just stop tracking
  const pauseTimer = useCallback(async () => {
    if (!state.isTimerRunning) return;
    
    // Don't close the segment - just mark as paused
    pauseStartTimeRef.current = Date.now();
    
    setState(prev => ({
      ...prev,
      isTimerRunning: false,
    }));
  }, [state.isTimerRunning]);

  // Resume timer - continue the same segment
  const resumeTimer = useCallback(async () => {
    if (!user || !state.currentTimerSessionId || !state.currentTopicId) return;
    if (state.isTimerRunning) return;
    
    // If we have an existing segment, just resume it
    if (state.currentSegmentId) {
      // Calculate how long we were paused
      const pauseDuration = pauseStartTimeRef.current 
        ? Math.floor((Date.now() - pauseStartTimeRef.current) / 1000)
        : 0;
      
      pauseStartTimeRef.current = null;
      
      setState(prev => ({
        ...prev,
        isTimerRunning: true,
        pausedDuration: prev.pausedDuration + pauseDuration,
      }));
      return;
    }
    
    // No existing segment - create a new one (shouldn't happen in normal flow)
    try {
      const now = new Date().toISOString();
      const { data: newSegment, error } = await supabase
        .from('topic_time_segments')
        .insert({
          timer_session_id: state.currentTimerSessionId,
          topic_id: state.currentTopicId,
          user_id: user.id,
          started_at: now,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      segmentStartTimeRef.current = Date.now();
      
      setState(prev => ({
        ...prev,
        currentSegmentId: newSegment.id,
        isTimerRunning: true,
        pausedDuration: 0,
      }));
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  }, [user, state.currentTimerSessionId, state.currentTopicId, state.isTimerRunning, state.currentSegmentId]);

  // Stop timer completely (end session)
  const stopTimer = useCallback(async () => {
    if (!state.currentTimerSessionId) return;
    
    try {
      // Close current segment if running
      if (state.isTimerRunning && state.currentSegmentId) {
        await closeCurrentSegment();
      }
      
      // Calculate total session time
      const { data: segments } = await supabase
        .from('topic_time_segments')
        .select('duration_seconds')
        .eq('timer_session_id', state.currentTimerSessionId);
      
      const totalSeconds = segments?.reduce((sum, seg) => sum + (seg.duration_seconds || 0), 0) || 0;
      
      // Close the timer session (excluding paused time)
      await supabase
        .from('timer_sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_seconds: totalSeconds,
        })
        .eq('id', state.currentTimerSessionId);
    } catch (error) {
      console.error('Error closing timer session:', error);
    }
    
    segmentStartTimeRef.current = null;
    pauseStartTimeRef.current = null;
    
    setState({
      currentTimerSessionId: null,
      currentTopicId: null,
      currentSegmentId: null,
      isTimerRunning: false,
      pausedDuration: 0,
    });
  }, [state.currentTimerSessionId, state.isTimerRunning, state.currentSegmentId]);
  // Only updates duration when timer is actively running (not paused)
  useEffect(() => {
    if (state.isTimerRunning && state.currentSegmentId && segmentStartTimeRef.current) {
      const syncInterval = setInterval(async () => {
        const totalElapsed = Math.floor((Date.now() - (segmentStartTimeRef.current || 0)) / 1000);
        const actualDuration = Math.max(0, totalElapsed - state.pausedDuration);
        
        // Update segment duration in DB (partial save)
        await supabase
          .from('topic_time_segments')
          .update({ duration_seconds: actualDuration })
          .eq('id', state.currentSegmentId);
      }, 30000);
      
      return () => clearInterval(syncInterval);
    }
  }, [state.isTimerRunning, state.currentSegmentId, state.pausedDuration]);

  // Get total time for a specific topic (including live elapsed if currently active)
  const getTopicTotalTime = useCallback((topicId: string): number => {
    let total = topicTotalTimes[topicId] || 0;
    // Add current segment time if it's for this topic
    if (state.isTimerRunning && state.currentTopicId === topicId) {
      total += liveElapsedSeconds;
    }
    return total;
  }, [topicTotalTimes, state.isTimerRunning, state.currentTopicId, liveElapsedSeconds]);

  // Get elapsed time in current segment (accounting for pauses)
  const getCurrentSegmentElapsed = useCallback((): number => {
    if (!segmentStartTimeRef.current) return 0;
    const totalElapsed = Math.floor((Date.now() - segmentStartTimeRef.current) / 1000);
    return Math.max(0, totalElapsed - state.pausedDuration);
  }, [state.pausedDuration]);

  return {
    // State
    currentTimerSessionId: state.currentTimerSessionId,
    currentTopicId: state.currentTopicId,
    currentSegmentId: state.currentSegmentId,
    isTimerRunning: state.isTimerRunning,
    topicTotalTimes,
    liveElapsedSeconds,
    
    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    switchTopic,
    
    // Queries
    getTopicTotalTime,
    getCurrentSegmentElapsed,
    refetchTotals: fetchTopicTotalTimes,
  };
};
