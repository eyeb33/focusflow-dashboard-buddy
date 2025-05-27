
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { formatTime as formatTimeUtil, getModeLabel as getModeLabelUtil } from '@/utils/timerUtils';
import { useOptimizedTimer } from './timer/useOptimizedTimer';
import { useOptimizedDocumentTitle } from './useOptimizedDocumentTitle';
import { useTimerAudio } from './useTimerAudio';
import { DEFAULT_TIMER_SETTINGS } from './timer/useTimerDefaults';

/**
 * Main timer hook that provides all timer functionality
 */
export const useTimer = (settings?: typeof DEFAULT_TIMER_SETTINGS) => {
  console.log('useTimer hook initializing with settings:', settings);
  
  // Use provided settings or defaults
  const timerSettings = settings || DEFAULT_TIMER_SETTINGS;
  
  // Initialize audio context
  useTimerAudio();
  
  // Use optimized timer
  const {
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
    getTotalTimeForMode
  } = useOptimizedTimer({
    settings: timerSettings,
    onTimerComplete: () => {
      console.log('Timer completed for mode:', timerMode);
      // Handle completion logic here if needed
    }
  });
  
  // Update document title
  useOptimizedDocumentTitle({
    timeRemaining,
    timerMode,
    isRunning
  });
  
  // Format time and get mode label
  const formatTime = useCallback((seconds: number) => {
    return formatTimeUtil(seconds);
  }, []);
  
  const getModeLabel = useCallback((mode?: TimerMode) => {
    return getModeLabelUtil(mode || timerMode);
  }, [timerMode]);
  
  return {
    // Timer state
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions, 
    totalTimeToday,
    currentSessionIndex,
    progress,
    settings: timerSettings,
    
    // Timer actions
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    
    // Helper functions
    formatTime,
    getModeLabel
  };
};
