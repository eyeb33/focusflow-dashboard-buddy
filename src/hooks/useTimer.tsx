
import { useEffect, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { formatTime as formatTimeUtil, getModeLabel as getModeLabelUtil } from '@/utils/timerUtils';
import { useTimerState } from './timer/useTimerState';
import { useTimerProgress } from './timer/useTimerProgress';
import { useTimerPersistence } from './timer/useTimerPersistence';
import { useTimerControls } from './timer/useTimerControls';
import { useTimerCompletion } from './timer/useTimerCompletion';
import { useTimerTick } from './timer/useTimerTick';
import { useTimerVisibility } from './timer/useTimerVisibility';

// Default settings to use if none are provided
const DEFAULT_SETTINGS = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

/**
 * Main timer hook that provides all timer functionality
 */
export const useTimer = (settings?: typeof DEFAULT_SETTINGS) => {
  console.log('useTimer hook initializing with settings:', settings);
  
  // Use provided settings or defaults if undefined
  const timerSettings = settings || DEFAULT_SETTINGS;
  
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
  
  // Handle visibility changes
  useTimerVisibility({
    isRunning,
    timeRemaining,
    setTimeRemaining,
    lastTickTimeRef,
    pausedTimeRef,
    handleTimerComplete
  });
  
  // Load initial timer state
  useEffect(() => {
    if (!isInitialLoadRef.current) return;
    
    try {
      const savedState = loadTimerState();
      if (savedState) {
        console.log('Restoring timer state from localStorage:', savedState);
        
        // Restore timer state but don't auto-start
        setTimerMode(savedState.timerMode || 'work');
        setTimeRemaining(savedState.timeRemaining);
        setCurrentSessionIndex(savedState.currentSessionIndex || 0);
        
        // Explicitly store the paused time
        if (!savedState.isRunning && savedState.timeRemaining) {
          console.log('Restoring exact paused time:', savedState.timeRemaining);
          pausedTimeRef.current = savedState.timeRemaining;
        }
        
        if (savedState.sessionStartTime) {
          sessionStartTimeRef.current = savedState.sessionStartTime;
        }
      }
      
      // Mark initial load as complete
      isInitialLoadRef.current = false;
    } catch (error) {
      console.error('Error loading saved timer state:', error);
      isInitialLoadRef.current = false;
    }
  }, [loadTimerState, setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef, isInitialLoadRef]);
  
  // Update timer when settings change (when not running)
  useEffect(() => {
    if (isInitialLoadRef.current) return;
    
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      console.log(`Settings changed: Updating timer to ${newTime} seconds`);
      
      // Don't update if it was just paused (preserve paused time)
      if (pausedTimeRef.current !== null) {
        console.log('Not updating time due to recent pause. Keeping:', pausedTimeRef.current);
        return;
      }
      
      setTimeRemaining(newTime);
      
      // Save the updated state
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: newTime,
        currentSessionIndex,
        sessionStartTime: null
      });
    }
  }, [timerSettings, timerMode, isRunning, currentSessionIndex, getTotalTimeForMode, saveTimerState, isInitialLoadRef, setTimeRemaining, pausedTimeRef]);
  
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
