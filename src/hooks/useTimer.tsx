
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { formatTime as formatTimeUtil, getModeLabel as getModeLabelUtil } from '@/utils/timerUtils';
import { useTimerLogic } from './useTimerLogic';
import { useOptimizedDocumentTitle } from './useOptimizedDocumentTitle';
import { useTimerAudio } from './useTimerAudio';

const DEFAULT_TIMER_SETTINGS = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  showNotifications: true,
  soundEnabled: true,
  soundVolume: 0.75,
  soundId: 'zen-bell',
  timerType: 'pomodoro' as const
};

/**
 * Main timer hook that provides all timer functionality
 */
export const useTimer = (settings?: typeof DEFAULT_TIMER_SETTINGS) => {
  // Use provided settings or defaults
  const timerSettings = settings || DEFAULT_TIMER_SETTINGS;
  
  // Initialize audio context
  useTimerAudio();
  
  // Use our simplified timer logic
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
    handleModeChange
  } = useTimerLogic({ settings: timerSettings, activeTaskId: null });
  
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
