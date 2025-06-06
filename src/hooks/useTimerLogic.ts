
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode, getTotalTime, savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { toast } from 'sonner';

interface UseTimerLogicProps {
  settings: TimerSettings;
}

export function useTimerLogic({ settings }: UseTimerLogicProps) {
  const { user } = useAuth();
  
  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // Refs for timer management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<string | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);
  const pausedTimeRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  
  // Get total time for current mode
  const getTotalTimeForMode = useCallback(() => {
    switch(timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  }, [timerMode, settings]);
  
  // Calculate progress
  const progress = (getTotalTimeForMode() - timeRemaining) / getTotalTimeForMode() * 100;
  
  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
  }, []);
  
  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    console.log('Timer completed for mode:', timerMode);
    clearTimer();
    setIsRunning(false);
    
    // Show completion toast
    const modeLabel = timerMode === 'work' ? 'Focus' : 
                     timerMode === 'break' ? 'Break' : 'Long Break';
    toast.success(`${modeLabel} session completed!`);
    
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
      
      // Auto-start break
      setTimeout(() => {
        setIsRunning(true);
        sessionStartTimeRef.current = new Date().toISOString();
      }, 500);
      
    } else {
      // After break
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto-start work after short break, manual start after long break
      if (timerMode === 'break') {
        setTimeout(() => {
          setIsRunning(true);
          sessionStartTimeRef.current = new Date().toISOString();
        }, 500);
      } else {
        sessionStartTimeRef.current = null;
      }
    }
    
    lastRecordedFullMinutesRef.current = 0;
    pausedTimeRef.current = null;
  }, [timerMode, settings, completedSessions, currentSessionIndex, clearTimer]);
  
  // Start timer
  const handleStart = useCallback(() => {
    console.log('Starting timer - current time:', timeRemaining, 'paused time:', pausedTimeRef.current);
    
    if (isRunning) {
      console.log('Timer already running, ignoring start');
      return;
    }
    
    // Use paused time if available
    const startTime = pausedTimeRef.current || timeRemaining;
    setTimeRemaining(startTime);
    setIsRunning(true);
    
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    
    // Clear paused time since we're starting
    pausedTimeRef.current = null;
    
    console.log('Timer started with time:', startTime);
  }, [isRunning, timeRemaining]);
  
  // Pause timer
  const handlePause = useCallback(() => {
    console.log('Pausing timer at time:', timeRemaining);
    
    // CRITICAL: Store current time as paused time FIRST
    pausedTimeRef.current = timeRemaining;
    console.log('Stored paused time:', pausedTimeRef.current);
    
    // Then stop the timer
    clearTimer();
    setIsRunning(false);
    
    // Save partial session if needed
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
  }, [timeRemaining, clearTimer, user, timerMode, getTotalTimeForMode]);
  
  // Reset timer
  const handleReset = useCallback(() => {
    console.log('Resetting timer');
    clearTimer();
    setIsRunning(false);
    pausedTimeRef.current = null;
    
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    if (timerMode === 'work') {
      setCurrentSessionIndex(0);
    }
  }, [clearTimer, getTotalTimeForMode, timerMode]);
  
  // Change timer mode
  const handleModeChange = useCallback((newMode: TimerMode) => {
    console.log('Changing mode to:', newMode);
    clearTimer();
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
  }, [clearTimer, settings]);
  
  // Timer tick effect
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }
    
    console.log('Starting timer interval with time:', timeRemaining);
    const now = Date.now();
    targetEndTimeRef.current = now + (timeRemaining * 1000);
    
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
    
    return () => clearTimer();
  }, [isRunning, timeRemaining, handleTimerComplete, user, timerMode, getTotalTimeForMode, clearTimer]);
  
  // Update time when settings change (only if not running and not paused)
  useEffect(() => {
    if (!isRunning && pausedTimeRef.current === null) {
      const newTime = getTotalTimeForMode();
      console.log('Settings changed, updating time to:', newTime);
      setTimeRemaining(newTime);
    } else {
      console.log('Settings changed but preserving timer state - running:', isRunning, 'paused:', pausedTimeRef.current !== null);
    }
  }, [settings, timerMode, isRunning, getTotalTimeForMode]);
  
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
    sessionStartTimeRef
  };
}
