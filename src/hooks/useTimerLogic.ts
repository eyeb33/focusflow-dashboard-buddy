
import { useTimerSettings } from './useTimerSettings';
import { useTimerState } from './useTimerState';
import { useTimerControlsLogic } from './useTimerControlsLogic';
import { useTimerCompletion } from './useTimerCompletion';
import { useTimerStatsLogic } from './useTimerStatsLogic';
import { useTimerProgress } from './timer/useTimerProgress';
import { useTimerInitialization } from './timer/useTimerInitialization';
import { useSessionTracking } from './timer/useSessionTracking';
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
  
  // Refs for timer ticking
  const lastRecordedFullMinutesRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Calculate progress
  const { progress, getTotalTimeForMode } = useTimerProgress(timerMode, timeRemaining, settings);

  // Initialize timer controls
  const {
    handleStart: controlsHandleStart,
    handlePause,
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

  // Fix: Create a handleStart function that always passes the timerMode
  const handleStart = () => {
    console.log("handleStart in useTimerLogic called with mode:", timerMode);
    controlsHandleStart(timerMode);
  };

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
    handleReset,
    handleModeChange,
    sessionStartTimeRef,
    handleTimerComplete
  };
}
