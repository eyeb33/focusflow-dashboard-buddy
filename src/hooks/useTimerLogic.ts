
import { useTimerSettings } from './useTimerSettings';
import { useTimerState } from './useTimerState';
import { useTimerControlsLogic } from './useTimerControlsLogic';
import { useTimerCompletion } from './useTimerCompletion';
import { useTimerStatsLogic } from './useTimerStatsLogic';
import { useTimerProgress } from './timer/useTimerProgress';
import { useTimerInitialization } from './timer/useTimerInitialization';
import { useSessionTracking } from './timer/useSessionTracking';
import { getTotalTime } from '@/utils/timerContextUtils';
import { useEffect } from 'react';

export function useTimerLogic(settings: ReturnType<typeof useTimerSettings>['settings']) {
  // Initialize core timer state
  const { timerMode, setTimerMode } = useTimerInitialization();
  
  // Calculate appropriate initial time based on mode and settings
  const initialTime = getTotalTime(timerMode, settings);
  
  const {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    autoStart,
    setAutoStart
  } = useTimerState(initialTime);

  // Sync timeRemaining with settings when they change
  useEffect(() => {
    if (!isRunning) {
      const newTime = getTotalTime(timerMode, settings);
      console.log(`Settings changed: Updating timer for ${timerMode} mode to ${newTime} seconds`);
      setTimeRemaining(newTime);
    }
  }, [settings, timerMode, isRunning]);

  // Initialize stats tracking
  const {
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex
  } = useTimerStatsLogic();

  // Initialize session tracking
  const {
    sessionStartTimeRef,
    skipTimerResetRef,
    previousSettingsRef,
    modeChangeInProgressRef
  } = useSessionTracking();

  // Calculate progress
  const { progress, getTotalTime: getModeTotalTime } = useTimerProgress(timerMode, timeRemaining, settings);

  // Initialize timer controls
  const {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    resetTimerState
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
    handleStart,  // This function expects the timerMode parameter
    handlePause,
    handleReset,
    handleModeChange,
    setAutoStart,
    sessionStartTimeRef,
    handleTimerComplete
  };
}
