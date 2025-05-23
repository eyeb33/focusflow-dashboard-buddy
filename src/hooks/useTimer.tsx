
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { formatTime as formatTimeUtil, getModeLabel as getModeLabelUtil } from '@/utils/timerUtils';
import { useTimerState } from './timer/useTimerState';
import { useTimerProgress } from './timer/useTimerProgress';
import { useTimerPersistence } from './timer/useTimerPersistence';
import { useTimerControls } from './timer/useTimerControls';
import { useTimerCompletion } from './timer/useTimerCompletion';
import { useTimerTick } from './timer/useTimerTick';
import { DEFAULT_TIMER_SETTINGS } from './timer/useTimerDefaults';
import { useTimerStateRestoration } from './timer/useTimerStateRestoration';
import { useTimerSettingsSync } from './timer/useTimerSettingsSync';
import { useDocumentTitle } from './useDocumentTitle';
import { useTimerAudio } from './useTimerAudio';

/**
 * Main timer hook that provides all timer functionality
 */
export const useTimer = (settings?: typeof DEFAULT_TIMER_SETTINGS) => {
  console.log('useTimer hook initializing with settings:', settings);
  
  // Use provided settings or defaults if undefined
  const timerSettings = settings || DEFAULT_TIMER_SETTINGS;
  
  // Initialize audio context for timer sounds
  useTimerAudio();
  
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
    timerRef,
    lastTickTimeRef,
    sessionStartTimeRef,
    pausedTimeRef,
    isInitialLoadRef
  } = useTimerState({
    initialMode: 'work',
    initialTime: timerSettings.workDuration * 60
  });
  
  console.log('Initial timer state:', { 
    timerMode, 
    isRunning, 
    timeRemaining, 
    pausedTimeRef: pausedTimeRef.current 
  });
  
  // Calculate progress
  const { progress, getTotalTimeForMode } = useTimerProgress(timerMode, timeRemaining, timerSettings);
  
  // Format time and get mode label
  const formatTime = useCallback((seconds: number) => {
    return formatTimeUtil(seconds);
  }, []);
  
  const getModeLabel = useCallback((mode?: TimerMode) => {
    return getModeLabelUtil(mode || timerMode);
  }, [timerMode]);
  
  // Setup persistence
  const { saveTimerState, loadTimerState } = useTimerPersistence();
  
  // Load initial timer state
  useTimerStateRestoration({
    loadTimerState,
    setTimerMode,
    setTimeRemaining,
    setCurrentSessionIndex,
    pausedTimeRef,
    sessionStartTimeRef,
    isInitialLoadRef
  });
  
  // Setup timer controls
  const {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  } = useTimerControls({
    timerMode,
    setTimerMode,
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    sessionStartTimeRef,
    pausedTimeRef,
    currentSessionIndex,
    setCurrentSessionIndex,
    settings: timerSettings,
    saveTimerState
  });
  
  // Handle timer completion
  const { handleTimerComplete } = useTimerCompletion({
    timerMode,
    setTimerMode,
    isRunning,
    setIsRunning,
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex,
    sessionStartTimeRef,
    pausedTimeRef,
    settings: timerSettings,
    setTimeRemaining
  });
  
  // Sync timer with settings changes
  useTimerSettingsSync({
    isInitialLoadRef,
    isRunning,
    timerMode,
    pausedTimeRef,
    getTotalTimeForMode,
    setTimeRemaining,
    saveTimerState,
    currentSessionIndex,
    timeRemaining
  });
  
  // Setup timer tick
  useTimerTick({
    isRunning,
    timerMode,
    timeRemaining,
    setTimeRemaining,
    timerRef,
    lastTickTimeRef,
    sessionStartTimeRef,
    pausedTimeRef,
    handleTimerComplete,
    saveTimerState,
    currentSessionIndex
  });
  
  // Update document title based on timer state
  useDocumentTitle({
    timeRemaining,
    timerMode,
    isRunning,
    formatTime,
    settings: timerSettings
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
