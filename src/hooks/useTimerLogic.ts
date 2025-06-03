
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

  // Initialize timer controls with pause/resume functionality
  const {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    resetTimerState,
    lastRecordedFullMinutesRef: controlsFullMinutesRef,
    hasPausedTime,
    getPausedTime
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

  // REMOVED THE PROBLEMATIC useEffect THAT WAS RESETTING THE TIMER
  // The timer controls logic now handles all state management properly

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
