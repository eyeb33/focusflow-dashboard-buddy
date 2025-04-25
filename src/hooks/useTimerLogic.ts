import { useRef, useState, useEffect } from 'react';
import { TimerMode, getTotalTime } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { useRestoreTimerState } from './useRestoreTimerState';
import { useTimerVisibilitySync } from './useTimerVisibilitySync';
import { useTimerTickLogic } from './useTimerTickLogic';
import { useTimerControlsLogic } from './useTimerControlsLogic';
import { useTimerCompletion } from './useTimerCompletion';
import { useTimerStatsLogic } from './useTimerStatsLogic';
import { useTimerAudio } from './useTimerAudio';
import { useTimerState } from './useTimerState';
import { useSessionTracking } from './useSessionTracking';
import { useTimerSettingsSync } from './useTimerSettingsSync';

export function useTimerLogic(settings: TimerSettings) {
  const [timerMode, setTimerMode] = useState<TimerMode>('work');

  // Use the smaller hooks
  const {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    autoStart,
    setAutoStart
  } = useTimerState(settings);

  const {
    sessionStartTimeRef,
    skipTimerResetRef,
    previousSettingsRef,
    modeChangeInProgressRef
  } = useSessionTracking();

  const {
    completedSessions,
    setCompletedSessions,
    totalTimeToday,
    setTotalTimeToday,
    currentSessionIndex,
    setCurrentSessionIndex
  } = useTimerStatsLogic();

  const {
    handleTimerComplete
  } = useTimerCompletion({
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

  const {
    lastRecordedFullMinutesRef,
    handleStart: baseHandleStart,
    handlePause: baseHandlePause,
    handleReset: baseHandleReset,
    handleModeChange: baseHandleModeChange,
    resetTimerState
  } = useTimerControlsLogic(settings);

  // Initialize audio
  useTimerAudio();

  // Use the timer settings sync hook
  useTimerSettingsSync({
    timerMode,
    settings,
    isRunning,
    setTimeRemaining,
    skipTimerResetRef,
    modeChangeInProgressRef,
    previousSettingsRef,
    sessionStartTimeRef
  });

  // Use restore state hook
  useRestoreTimerState({
    isRunning,
    setIsRunning,
    setTimeRemaining,
    onTimerComplete: handleTimerComplete,
    sessionStartTimeRef,
    setTimerMode
  });

  // Create a reference to hold the timer state
  const timerStateRef = useRef({
    isRunning,
    timerMode,
    timeRemaining
  });

  // Keep the ref updated with current state
  useEffect(() => {
    timerStateRef.current = {
      isRunning,
      timerMode,
      timeRemaining
    };
  }, [isRunning, timerMode, timeRemaining]);

  // Reference for tracking the last tick time
  const lastTickTimeRef = useRef<number>(Date.now());

  // Use the timer visibility sync hook
  useTimerVisibilitySync({
    isRunning,
    timerMode,
    timerStateRef,
    setTimeRemaining,
    onTimerComplete: handleTimerComplete,
    lastTickTimeRef,
    sessionStartTimeRef
  });

  // Use the timer tick logic hook
  useTimerTickLogic({
    isRunning,
    timerMode,
    getTotalTime: () => getTotalTime(timerMode, settings),
    onTimerComplete: handleTimerComplete,
    setTimeRemaining,
    timeRemaining,
    lastRecordedFullMinutesRef,
    lastTickTimeRef,
    sessionStartTimeRef
  });

  // Create wrappers for the control handlers
  const handleStart = () => {
    sessionStartTimeRef.current = new Date().toISOString();
    baseHandleStart(timerMode);
  };
  
  const handlePause = () => {
    console.log("Setting skip flag before pause");
    skipTimerResetRef.current = true;
    baseHandlePause(timerMode);
  };
  
  const handleReset = () => {
    sessionStartTimeRef.current = null;
    skipTimerResetRef.current = false;
    
    setCompletedSessions(0);
    setCurrentSessionIndex(0);
    
    baseHandleReset(timerMode, setCurrentSessionIndex);
    
    localStorage.removeItem('timerState');
  };

  const handleModeChange = (mode: TimerMode) => {
    if (mode === timerMode) return;
    
    modeChangeInProgressRef.current = true;
    
    sessionStartTimeRef.current = null;
    skipTimerResetRef.current = false;
    
    if (mode === 'work') {
      setCompletedSessions(0);
      setCurrentSessionIndex(0);
    }
    
    baseHandleModeChange(timerMode, mode, setCurrentSessionIndex);
    setTimerMode(mode);
    
    localStorage.removeItem('timerState');
  };

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
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
