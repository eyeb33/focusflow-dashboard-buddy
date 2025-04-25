
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
  // Initialize core state first
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  
  // Initialize session tracking refs
  const {
    sessionStartTimeRef,
    skipTimerResetRef,
    previousSettingsRef,
    modeChangeInProgressRef
  } = useSessionTracking();

  // Initialize timer state
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

  // Initialize timer controls logic
  const {
    lastRecordedFullMinutesRef,
    handleStart: baseHandleStart,
    handlePause: baseHandlePause,
    handleReset: baseHandleReset,
    handleModeChange: baseHandleModeChange,
    resetTimerState
  } = useTimerControlsLogic(settings);

  // Create state reference for visibility tracking
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

  const lastTickTimeRef = useRef<number>(Date.now());

  // Initialize timer completion hook
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

  // Initialize audio hooks
  useTimerAudio();

  // Initialize settings sync hook
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

  // Initialize state restoration hook
  useRestoreTimerState({
    isRunning,
    setIsRunning,
    setTimeRemaining,
    onTimerComplete: handleTimerComplete,
    sessionStartTimeRef,
    setTimerMode
  });

  // Initialize visibility sync hook
  useTimerVisibilitySync({
    isRunning,
    timerMode,
    timerStateRef,
    setTimeRemaining,
    onTimerComplete: handleTimerComplete,
    lastTickTimeRef,
    sessionStartTimeRef
  });

  // Initialize timer tick logic
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

  // Wrapper functions for timer controls
  const handleStart = () => {
    console.log("handleStart called with current time:", timeRemaining);
    sessionStartTimeRef.current = new Date().toISOString();
    baseHandleStart(timerMode);
    // Force isRunning to true immediately in case of any state update delays
    setIsRunning(true);
  };
  
  const handlePause = () => {
    console.log("handlePause called with current time:", timeRemaining);
    skipTimerResetRef.current = true;
    baseHandlePause(timerMode);
    // Force isRunning to false immediately in case of any state update delays
    setIsRunning(false);
  };
  
  const handleReset = () => {
    console.log("handleReset called with current time:", timeRemaining);
    sessionStartTimeRef.current = null;
    skipTimerResetRef.current = false;
    
    setCompletedSessions(0);
    setCurrentSessionIndex(0);
    
    baseHandleReset(timerMode, setCurrentSessionIndex);
    
    localStorage.removeItem('timerState');
  };

  const handleModeChange = (mode: TimerMode) => {
    console.log("handleModeChange called to:", mode);
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
