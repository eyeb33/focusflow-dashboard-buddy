
import { useRef } from 'react';
import { TimerSettings } from '../useTimerSettings';
import { useTimerSessionTracking } from './useTimerSessionTracking';
import { useTimerCompletionHandler } from './useTimerCompletionHandler';
import { useTimerControls } from './useTimerControls';
import { useTimerVisibility } from './useTimerVisibility';
import { useTimerStateInitialization } from './useTimerStateInitialization';
import { useTimerProgress } from './useTimerProgress';
import { useTimerFormat } from './useTimerFormat';
import { useTimerTickHandler } from './useTimerTickHandler';

export function useTimerCore(settings: TimerSettings) {
  // Initialize core timer state
  const {
    timerMode,
    setTimerMode,
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex,
    saveTimerState
  } = useTimerStateInitialization(settings);
  
  // Timer refs
  const isCompletingCycleRef = useRef(false);
  
  // Session tracking
  const { sessionStartTimeRef, setSessionStartTime } = useTimerSessionTracking();

  // Calculate progress and get total time
  const { progress, getTotalTimeForMode } = useTimerProgress(timerMode, timeRemaining, settings);

  // Format helpers
  const { formatTime, getModeLabel } = useTimerFormat();

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
      console.log(`resetTimerState for mode ${timerMode}: setting time to ${newTime}`);
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

  // Handle timer tick
  const { lastTickTimeRef } = useTimerTickHandler({
    isRunning,
    timerMode,
    timeRemaining,
    setTimeRemaining,
    handleTimerComplete,
    sessionStartTimeRef,
    setSessionStartTime,
    currentSessionIndex,
    saveTimerState,
    getTotalTimeForMode
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
