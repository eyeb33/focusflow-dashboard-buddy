
import { useTimerSettings } from './useTimerSettings';
import { useTimerState } from './useTimerState';
import { useTimerControlsLogic } from './useTimerControlsLogic';
import { useTimerCompletion } from './useTimerCompletion';
import { useTimerStatsLogic } from './useTimerStatsLogic';
import { useTimerInitialization } from './timer/useTimerInitialization';
import { getTotalTime } from '@/utils/timerContextUtils';
import { useEffect, useRef } from 'react';
import { useTimerTickLogic } from './useTimerTickLogic';

export function useTimerLogic(settings: ReturnType<typeof useTimerSettings>['settings']) {
  // Initialize core timer state
  const { timerMode, setTimerMode } = useTimerInitialization();
  
  // Calculate appropriate initial time based on mode and settings
  const initialTime = getTotalTime(timerMode, settings);
  
  // Initialize timer state with the correct initial time
  const timerState = useTimerState({
    focus: settings.workDuration,
    break: settings.breakDuration,
    longBreak: settings.longBreakDuration,
    sessionsUntilLongBreak: settings.sessionsUntilLongBreak
  });

  const {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
  } = timerState;

  // Initialize stats tracking
  const {
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex
  } = useTimerStatsLogic();

  // Initialize session tracking refs
  const sessionStartTimeRef = useRef<string | null>(null);
  const skipTimerResetRef = useRef(false);
  const previousSettingsRef = useRef(settings);
  const modeChangeInProgressRef = useRef(false);
  const pausedTimeRef = useRef<number | null>(null);
  
  // Refs for timer ticking
  const lastRecordedFullMinutesRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Calculate progress
  const getTotalTimeForMode = () => {
    switch(timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  };

  const progress = (getTotalTimeForMode() - timeRemaining) / getTotalTimeForMode() * 100;

  // Initialize timer controls
  const {
    handleStart: controlsHandleStart,
    handlePause: controlsHandlePause,
    handleReset,
    handleModeChange,
    resetTimerState,
    lastRecordedFullMinutesRef: controlsFullMinutesRef
  } = useTimerControlsLogic({
    timerMode,
    settings,
    isRunning,
    timeRemaining,
    setIsRunning,
    setTimeRemaining,
    setTimerMode,
    sessionStartTimeRef,
    skipTimerResetRef,
    modeChangeInProgressRef,
    setCurrentSessionIndex
  });

  // Enhanced pause handler that preserves the current time
  const handlePause = () => {
    console.log("Enhanced pause handler called with time:", timeRemaining);
    // Store the current time as paused time BEFORE calling the original pause handler
    pausedTimeRef.current = timeRemaining;
    console.log("Stored paused time:", pausedTimeRef.current);
    
    // Call the original pause handler
    controlsHandlePause();
  };

  // Enhanced start handler that restores paused time if available
  const handleStart = () => {
    console.log("Enhanced start handler called. Paused time:", pausedTimeRef.current);
    
    // If we have a paused time, restore it before starting
    if (pausedTimeRef.current !== null) {
      console.log("Restoring paused time:", pausedTimeRef.current);
      setTimeRemaining(pausedTimeRef.current);
      // Clear the paused time after restoring
      pausedTimeRef.current = null;
    }
    
    // Call the original start handler
    controlsHandleStart(timerMode);
  };

  // Enhanced reset handler that clears paused time
  const handleResetEnhanced = () => {
    console.log("Enhanced reset handler called");
    pausedTimeRef.current = null;
    handleReset();
  };

  // Sync timeRemaining with settings when they change (but preserve paused state)
  useEffect(() => {
    // Don't reset if timer is running or if we have a paused time
    if (!isRunning && pausedTimeRef.current === null) {
      const newTime = getTotalTime(timerMode, settings);
      console.log(`Settings changed: Updating timer for ${timerMode} mode to ${newTime} seconds`);
      setTimeRemaining(newTime);
    } else if (pausedTimeRef.current !== null) {
      console.log("Settings changed but preserving paused time:", pausedTimeRef.current);
    }
  }, [settings, timerMode, isRunning, pausedTimeRef]);

  // Initialize timer completion logic
  const { handleTimerComplete } = useTimerCompletion({
    timerMode,
    settings,
    completedSessions,
    currentSessionIndex,
    setCompletedSessions,
    setTimerMode,
    setIsRunning,
    setTotalTimeToday,
    setCurrentSessionIndex,
    resetTimerState
  });

  // Initialize timer tick logic
  useTimerTickLogic({
    isRunning,
    timerMode,
    getTotalTime: () => getTotalTimeForMode(),
    onTimerComplete: handleTimerComplete,
    setTimeRemaining,
    timeRemaining,
    lastRecordedFullMinutesRef: controlsFullMinutesRef || lastRecordedFullMinutesRef,
    lastTickTimeRef,
    sessionStartTimeRef
  });

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    progress,
    setCompletedSessions,
    setTotalTimeToday,
    handleStart,
    handlePause,
    handleReset: handleResetEnhanced,
    handleModeChange,
    sessionStartTimeRef,
    handleTimerComplete
  };
}
