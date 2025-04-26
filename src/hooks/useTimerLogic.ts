
import { useTimerSettings } from './useTimerSettings';
import { useTimerState } from './useTimerState';
import { useTimerControlsLogic } from './useTimerControlsLogic';
import { useTimerCompletion } from './useTimerCompletion';
import { useTimerStatsLogic } from './useTimerStatsLogic';
import { useTimerProgress } from './timer/useTimerProgress';
import { useTimerInitialization } from './timer/useTimerInitialization';
import { useSessionTracking } from './timer/useSessionTracking';

export function useTimerLogic(settings: ReturnType<typeof useTimerSettings>['settings']) {
  // Initialize core timer state
  const { timerMode, setTimerMode } = useTimerInitialization();
  
  const {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    autoStart,
    setAutoStart
  } = useTimerState(settings);

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
  } = useSessionTracking(settings);

  // Calculate progress
  const { progress, getTotalTime } = useTimerProgress(timerMode, timeRemaining, settings);

  // Initialize timer controls
  const {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  } = useTimerControlsLogic({
    timerMode, // This is fine, not part of the settings object
    settings,  // This is the settings object
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
    setAutoStart,
    sessionStartTimeRef
  };
}
