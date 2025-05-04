
import { useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
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
  const { progress, getTotalTimeForMode, totalTime } = useTimerProgress(timerMode, timeRemaining, settings);

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
      // Calculate new time based on the mode that's being set
      const newTimerMode = timerMode === 'work' ? 'break' : 
                          (timerMode === 'break' ? 'work' : 'work');
                          
      // We need to calculate the time for the NEXT mode, not the current one
      let newTime;
      switch (newTimerMode) {
        case 'work':
          newTime = settings.workDuration * 60;
          break;
        case 'break':
          newTime = settings.breakDuration * 60;
          break;
        case 'longBreak':
          newTime = settings.longBreakDuration * 60;
          break;
        default:
          newTime = settings.workDuration * 60;
      }
      
      console.log(`resetTimerState for mode ${timerMode} -> ${newTimerMode}: setting time to ${newTime} seconds (${Math.floor(newTime / 60)}:${(newTime % 60).toString().padStart(2, '0')})`);
      setTimeRemaining(newTime);
      saveTimerState({
        timerMode: newTimerMode,
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
