
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode, getTotalTime, savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { updateDailyStats } from '@/utils/productivityStats';
import { useQueryClient } from '@tanstack/react-query';

interface UseTimerLogicProps {
  settings: TimerSettings;
  activeTaskId: string | null;
  onSessionComplete?: (sessionData: {
    mode: TimerMode;
    duration: number;
    taskId?: string;
  }) => void;
}

export function useTimerLogic({ settings, activeTaskId, onSessionComplete }: UseTimerLogicProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.timerType === 'freeStudy' ? 0 : settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [sessionGoal, setSessionGoal] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Free study elapsed time (counts up from 0)
  const [freeStudyElapsed, setFreeStudyElapsed] = useState(0);
  
  // Refs for timer management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionStartTimeRef = useRef<string | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);
  const pausedTimeRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const freeStudyStartTimeRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  const isFreeStudy = settings.timerType === 'freeStudy';
  
  // Get total time for current mode
  const getTotalTimeForMode = useCallback(() => {
    if (isFreeStudy) return 0; // No limit for free study
    switch(timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  }, [timerMode, settings, isFreeStudy]);
  
  // Calculate progress - for free study it's always 0 (no progress ring)
  const progress = isFreeStudy ? 0 : (getTotalTimeForMode() - timeRemaining) / getTotalTimeForMode() * 100;
  
  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
  }, []);
  
  // Clear auto-start timeout helper
  const clearAutoStartTimeout = useCallback(() => {
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
      autoStartTimeoutRef.current = null;
    }
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Clean up all timers on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
        autoStartTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    clearTimer();
    setIsRunning(false);
    
    // Show completion toast
    const modeLabel = timerMode === 'work' ? 'Focus' : 
                     timerMode === 'break' ? 'Break' : 'Long Break';
    toast.success(`${modeLabel} session completed!`);
    
    // Save completed session to database
    let sessionId: string | null = null;
    if (user && sessionStartTimeRef.current) {
      try {
        const sessionType = timerMode === 'work' ? 'work' : 
                           timerMode === 'break' ? 'short_break' : 'long_break';
        const duration = getTotalTimeForMode();
        
        // Get the session date
        const sessionDate = new Date(sessionStartTimeRef.current).toISOString().split('T')[0];
        
        // Save completed session with session goal
        const { data: sessionData, error: sessionError } = await supabase
          .from('focus_sessions')
          .insert({
            user_id: user.id,
            session_type: sessionType,
            duration: duration,
            completed: true,
            session_goal: sessionGoal || null
          })
          .select('id')
          .single();
        
        if (sessionError) throw sessionError;
        sessionId = sessionData?.id || null;
        setCurrentSessionId(sessionId);
        
        // Update daily stats summary
        await supabase.rpc('save_session_progress', {
          p_user_id: user.id,
          p_session_type: sessionType,
          p_duration: duration,
          p_completed: true
        });
        
        // Update daily stats if it's a work session
        if (timerMode === 'work') {
          const durationMinutes = Math.floor(duration / 60);
          await updateDailyStats(user.id, durationMinutes, 'work', sessionDate);
          
          // Update active task time if there's an active task
          if (activeTaskId) {
            try {
              const { updateTaskTimeSpent } = await import('@/services/taskService');
              await updateTaskTimeSpent(user.id, activeTaskId, durationMinutes);
            } catch (error) {
              console.error('Error updating task time:', error);
            }
          }
          
          // Invalidate all dashboard queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          queryClient.invalidateQueries({ queryKey: ['dailyProductivity'] });
          queryClient.invalidateQueries({ queryKey: ['weeklyProductivity'] });
          queryClient.invalidateQueries({ queryKey: ['monthlyProductivity'] });
          queryClient.invalidateQueries({ queryKey: ['streakData'] });
          queryClient.invalidateQueries({ queryKey: ['productivityTrends'] });
          queryClient.invalidateQueries({ queryKey: ['insights'] });
        }
      } catch (error) {
        console.error('Error saving completed session:', error);
        toast.error('Failed to save session progress');
      }
    }
    
    // Trigger reflection modal for work sessions
    if (timerMode === 'work' && onSessionComplete) {
      onSessionComplete({
        mode: timerMode,
        duration: getTotalTimeForMode(),
        taskId: activeTaskId || undefined
      });
    }
    
    if (timerMode === 'work') {
      // After work session
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalTimeToday(prev => prev + settings.workDuration);
      
      const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
      setCurrentSessionIndex(newSessionIndex);
      
      const nextMode: TimerMode = newSessionIndex === 0 ? 'longBreak' : 'break';
      setTimerMode(nextMode);
      
      const nextTime = nextMode === 'longBreak' 
        ? settings.longBreakDuration * 60 
        : settings.breakDuration * 60;
      setTimeRemaining(nextTime);
      
      // Auto-start break with cleanup
      clearAutoStartTimeout();
      autoStartTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsRunning(true);
          sessionStartTimeRef.current = new Date().toISOString();
        }
      }, 500);
      
    } else {
      // After break
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto-start work after short break, manual start after long break
      if (timerMode === 'break') {
        clearAutoStartTimeout();
        autoStartTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setIsRunning(true);
            sessionStartTimeRef.current = new Date().toISOString();
          }
        }, 500);
      } else {
        sessionStartTimeRef.current = null;
      }
    }
    
    lastRecordedFullMinutesRef.current = 0;
    pausedTimeRef.current = null;
  }, [timerMode, settings, completedSessions, currentSessionIndex, clearTimer, clearAutoStartTimeout, user, getTotalTimeForMode]);
  
  // Start timer with optional goal
  const handleStart = useCallback((goal?: string) => {
    if (isRunning) return;
    
    // Set session goal if provided
    if (goal !== undefined) {
      setSessionGoal(goal);
    }
    
    if (isFreeStudy) {
      // Free study mode - start counting up
      setIsRunning(true);
      freeStudyStartTimeRef.current = Date.now() - (freeStudyElapsed * 1000);
      sessionStartTimeRef.current = new Date().toISOString();
    } else {
      // Pomodoro mode - count down
      const startTime = pausedTimeRef.current || timeRemaining;
      setTimeRemaining(startTime);
      setIsRunning(true);
      
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
      }
      
      // Clear paused time since we're starting
      pausedTimeRef.current = null;
    }
  }, [isRunning, timeRemaining, isFreeStudy, freeStudyElapsed]);
  
  // Save session reflection
  const saveSessionReflection = useCallback(async (quality: 'completed' | 'progress' | 'distracted', reflection: string) => {
    if (!user || !currentSessionId) return;
    
    try {
      await supabase
        .from('focus_sessions')
        .update({
          session_quality: quality,
          session_reflection: reflection
        })
        .eq('id', currentSessionId);
      
      toast.success('Session reflection saved');
    } catch (error) {
      console.error('Error saving reflection:', error);
      toast.error('Failed to save reflection');
    }
  }, [user, currentSessionId]);
  
  // Pause timer
  const handlePause = useCallback(async () => {
    // CRITICAL: Store current time as paused time FIRST
    pausedTimeRef.current = timeRemaining;
    
    // Then stop the timer
    clearTimer();
    setIsRunning(false);
    
    if (isFreeStudy) {
      // Save free study session when pausing
      if (user && freeStudyElapsed >= 60 && activeTaskId) {
        try {
          const { updateTaskTimeSpent } = await import('@/services/taskService');
          const elapsedMinutes = Math.floor(freeStudyElapsed / 60);
          await updateTaskTimeSpent(user.id, activeTaskId, elapsedMinutes);
          
          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          queryClient.invalidateQueries({ queryKey: ['dailyProductivity'] });
        } catch (error) {
          console.error('Error updating task time:', error);
        }
      }
    } else {
      // Save partial session if needed (Pomodoro mode)
      if (user && sessionStartTimeRef.current) {
        const totalTime = getTotalTimeForMode();
        savePartialSession(
          user.id,
          timerMode,
          totalTime,
          timeRemaining,
          lastRecordedFullMinutesRef.current
        );
      }
    }
  }, [timeRemaining, clearTimer, user, timerMode, getTotalTimeForMode, isFreeStudy, freeStudyElapsed, activeTaskId, queryClient]);
  
  // Reset timer
  const handleReset = useCallback(() => {
    clearTimer();
    clearAutoStartTimeout();
    setIsRunning(false);
    pausedTimeRef.current = null;
    
    if (isFreeStudy) {
      setFreeStudyElapsed(0);
      setTimeRemaining(0);
      freeStudyStartTimeRef.current = null;
    } else {
      const newTime = getTotalTimeForMode();
      setTimeRemaining(newTime);
    }
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    if (timerMode === 'work') {
      setCurrentSessionIndex(0);
    }
  }, [clearTimer, clearAutoStartTimeout, getTotalTimeForMode, timerMode, isFreeStudy]);
  
  // Change timer mode
  const handleModeChange = useCallback((newMode: TimerMode) => {
    clearTimer();
    clearAutoStartTimeout();
    setIsRunning(false);
    pausedTimeRef.current = null;
    
    setTimerMode(newMode);
    const newTime = getTotalTime(newMode, settings);
    setTimeRemaining(newTime);
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    if (newMode === 'work') {
      setCurrentSessionIndex(0);
    }
  }, [clearTimer, clearAutoStartTimeout, settings]);
  
  // Timer tick effect - CRITICAL: Don't include timeRemaining in deps!
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }
    
    if (isFreeStudy) {
      // Free study mode - count UP
      if (freeStudyStartTimeRef.current === null) {
        freeStudyStartTimeRef.current = Date.now() - (freeStudyElapsed * 1000);
      }
      
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (freeStudyStartTimeRef.current || Date.now())) / 1000);
        setFreeStudyElapsed(elapsed);
        setTimeRemaining(elapsed); // Use timeRemaining to display elapsed time
      }, 200);
    } else {
      // Pomodoro mode - count DOWN
      if (targetEndTimeRef.current === null) {
        const now = Date.now();
        targetEndTimeRef.current = now + (timeRemaining * 1000);
      }
      
      timerRef.current = setInterval(() => {
        const currentTime = Date.now();
        
        if (targetEndTimeRef.current !== null) {
          const remainingMs = targetEndTimeRef.current - currentTime;
          const newSecondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
          
          setTimeRemaining(prev => {
            if (newSecondsRemaining !== prev) {
              if (newSecondsRemaining <= 0) {
                handleTimerComplete();
                return 0;
              }
              
              // Save partial session at minute boundaries
              if (user && timerMode === 'work') {
                const totalTime = getTotalTimeForMode();
                const elapsedSeconds = totalTime - newSecondsRemaining;
                const newFullMinutes = Math.floor(elapsedSeconds / 60);
                
                if (newFullMinutes > lastRecordedFullMinutesRef.current) {
                  const startDate = sessionStartTimeRef.current
                    ? new Date(sessionStartTimeRef.current).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0];
                  
                  savePartialSession(
                    user.id,
                    timerMode,
                    totalTime,
                    newSecondsRemaining,
                    lastRecordedFullMinutesRef.current,
                    startDate
                  );
                  
                  lastRecordedFullMinutesRef.current = newFullMinutes;
                }
              }
              
              return newSecondsRemaining;
            }
            return prev;
          });
        }
      }, 200);
    }
    
    return () => clearTimer();
  }, [isRunning, handleTimerComplete, user, timerMode, getTotalTimeForMode, clearTimer, isFreeStudy, freeStudyElapsed]);
  
  // Update time when settings change (only if not running and not paused)
  useEffect(() => {
    if (!isRunning && pausedTimeRef.current === null) {
      if (isFreeStudy) {
        setTimeRemaining(freeStudyElapsed);
      } else {
        const newTime = getTotalTimeForMode();
        setTimeRemaining(newTime);
      }
    }
  }, [settings, timerMode, isRunning, getTotalTimeForMode, isFreeStudy, freeStudyElapsed]);
  
  // Reset when timer type changes
  useEffect(() => {
    clearTimer();
    clearAutoStartTimeout();
    setIsRunning(false);
    pausedTimeRef.current = null;
    
    if (isFreeStudy) {
      setFreeStudyElapsed(0);
      setTimeRemaining(0);
      freeStudyStartTimeRef.current = null;
    } else {
      const newTime = getTotalTimeForMode();
      setTimeRemaining(newTime);
    }
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
  }, [settings.timerType, clearTimer, clearAutoStartTimeout, getTotalTimeForMode, isFreeStudy]);
  
  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    progress,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    sessionStartTimeRef,
    sessionGoal,
    setSessionGoal,
    saveSessionReflection,
    currentSessionId
  };
}
