
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadTodayStats } from '@/utils/timerContextUtils';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { useTimerState } from './timer/useTimerState';
import { useTimerCompletion } from './timer/useTimerCompletion';
import { useTimerPersistence } from './timer/useTimerPersistence';
import { useTimerControls } from './timer/useTimerControls';
import { useTimerInterval } from './useTimerInterval';

export function useTimerLogic(settings: TimerSettings) {
  const { user } = useAuth();
  
  // Combine all the timer hooks
  const {
    timerMode, setTimerMode,
    isRunning, setIsRunning,
    timeRemaining, setTimeRemaining,
    completedSessions, setCompletedSessions,
    totalTimeToday, setTotalTimeToday,
    autoStart, setAutoStart
  } = useTimerState(settings);
  
  const { handleTimerComplete } = useTimerCompletion({
    timerMode,
    completedSessions,
    settings,
    setCompletedSessions,
    setTotalTimeToday,
    setTimerMode,
    setTimeRemaining,
    setIsRunning
  });
  
  const {
    lastRecordedTimeRef,
    lastRecordedFullMinutesRef,
    getTotalTime
  } = useTimerPersistence({
    timerMode,
    isRunning,
    timeRemaining,
    settings,
    completedSessions,
    setTimerMode,
    setTimeRemaining,
    setIsRunning,
    setCompletedSessions,
    setTotalTimeToday,
    setAutoStart
  });
  
  const {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  } = useTimerControls({
    timerMode,
    settings,
    timeRemaining,
    isRunning,
    setTimerMode,
    setTimeRemaining,
    setIsRunning,
    getTotalTime,
    lastRecordedTimeRef,
    lastRecordedFullMinutesRef
  });
  
  // Reset timer when mode or settings change
  useEffect(() => {
    // Only reset if not running
    if (!isRunning && !autoStart) {
      setTimeRemaining(getTotalTime(timerMode, settings));
      lastRecordedTimeRef.current = getTotalTime(timerMode, settings);
      lastRecordedFullMinutesRef.current = 0;
    }
    
    // Clear the autoStart flag after applying it
    if (autoStart) {
      setAutoStart(false);
    }
  }, [timerMode, settings, isRunning, autoStart]);
  
  // Load user's stats when logged in
  useEffect(() => {
    if (user) {
      loadTodayStats(user.id).then(stats => {
        setCompletedSessions(stats.completedSessions);
        setTotalTimeToday(stats.totalTimeToday);
      });
    }
  }, [user]);

  // Get the current total time based on timer mode
  const getCurrentTotalTime = () => getTotalTime(timerMode, settings);

  // Use the timer interval hook
  useTimerInterval({
    isRunning,
    timerMode,
    timeRemaining,
    setTimeRemaining,
    getTotalTime: getCurrentTotalTime,
    onTimerComplete: handleTimerComplete,
    lastRecordedFullMinutesRef
  });

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    setCompletedSessions,
    setTotalTimeToday,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
