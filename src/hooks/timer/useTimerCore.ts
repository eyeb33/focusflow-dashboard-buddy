
import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';
import { useTimerPersistence } from './useTimerPersistence';
import { useTimerSessionTracking } from './useTimerSessionTracking';
import { useTimerCompletionHandler } from './useTimerCompletionHandler';
import { useTimerControls } from './useTimerControls';
import { useTimerVisibility } from './useTimerVisibility';

export function useTimerCore(settings: TimerSettings) {
  // Get user context for tracking stats
  const { 
    saveTimerState,
    loadTimerState,
    initialTimerMode,
    initialTimeRemaining,
    initialSessionIndex
  } = useTimerPersistence(settings);

  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>(initialTimerMode);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  
  // Stats tracking
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(initialSessionIndex);
  
  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const isCompletingCycleRef = useRef(false);
  
  // Session tracking
  const { sessionStartTimeRef, setSessionStartTime } = useTimerSessionTracking();

  // Calculate total time for current timer mode
  const getTotalTimeForMode = useCallback((): number => {
    switch (timerMode) {
      case 'work':
        return settings.workDuration * 60;
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  }, [timerMode, settings]);
  
  // Calculate progress (0 to 100)
  const totalTime = getTotalTimeForMode();
  const elapsedTime = totalTime - timeRemaining;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, elapsedTime / totalTime)) * 100 : 0;

  // Completion handler
  const { handleTimerComplete } = useTimerCompletionHandler({
    timerMode,
    settings,
    completedSessions,
    currentSessionIndex,
    setCompletedSessions,
    setTimerMode,
    setIsRunning,
    setTotalTimeToday,
    setCurrentSessionIndex,
    sessionStartTimeRef,
    setSessionStartTime,
    resetTimerState: () => {
      const newTime = getTotalTimeForMode();
      setTimeRemaining(newTime);
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: newTime,
        currentSessionIndex,
        sessionStartTime: null,
      });
    }
  });

  // Timer controls
  const { 
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
  } = useTimerControls({
    timerMode,
    settings,
    isRunning,
    timeRemaining,
    setIsRunning,
    setTimeRemaining,
    setTimerMode,
    sessionStartTimeRef,
    setSessionStartTime,
    setCurrentSessionIndex,
    getTotalTimeForMode,
    saveTimerState
  });

  // Handle visibility change
  useTimerVisibility({
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    handleTimerComplete,
    lastTickTimeRef
  });
  
  // Save state on changes
  useEffect(() => {
    saveTimerState({
      timerMode,
      isRunning,
      timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
    });
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, sessionStartTimeRef, saveTimerState]);

  // Handle timer tick
  useEffect(() => {
    // Always clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      console.log("Starting timer with mode:", timerMode, "and time:", timeRemaining);
      
      // Ensure we have a session start time
      if (!sessionStartTimeRef.current) {
        setSessionStartTime(new Date().toISOString());
      }
      
      lastTickTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
        
        setTimeRemaining(prevTime => {
          if (prevTime <= elapsedSeconds) {
            // Clear the timer and handle completion
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // We use setTimeout to ensure state updates occur in the next event loop
            setTimeout(() => handleTimerComplete(), 0);
            return 0;
          }
          const newTime = prevTime - elapsedSeconds;
          
          // Save timer state every 5 seconds
          if (prevTime % 5 === 0 || newTime % 5 === 0) {
            saveTimerState({
              timerMode,
              isRunning: true,
              timeRemaining: newTime,
              currentSessionIndex,
              sessionStartTime: sessionStartTimeRef.current,
            });
          }
          
          return newTime;
        });
        
        lastTickTimeRef.current = now;
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timerMode, saveTimerState, timeRemaining, sessionStartTimeRef, setSessionStartTime, currentSessionIndex, handleTimerComplete]);
  
  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get mode label helper
  const getModeLabel = (): string => {
    switch (timerMode) {
      case 'work': return 'Focus';
      case 'break': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Timer';
    }
  };
  
  return {
    // Timer state
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    progress,
    
    // Timer actions
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    
    // Helper functions
    formatTime,
    getModeLabel,
    
    // For advanced usage
    sessionStartTimeRef,
  };
}
