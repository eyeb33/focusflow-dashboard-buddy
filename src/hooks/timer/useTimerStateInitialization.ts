
import { useState, useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';
import { useTimerPersistence } from './useTimerPersistence';

export function useTimerStateInitialization(settings: TimerSettings) {
  const {
    saveTimerState,
    initialTimerMode,
    initialTimeRemaining,
    initialSessionIndex
  } = useTimerPersistence(settings);

  // Core timer state - always start fresh on page load
  const [timerMode, setTimerMode] = useState<TimerMode>(initialTimerMode);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining);
  
  // Stats tracking
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(initialSessionIndex);

  // Update timer when settings change and timer is not running
  useEffect(() => {
    if (!isRunning) {
      // Calculate new time based on current mode and new settings
      let newTimeRemaining = settings.workDuration * 60;
      
      switch (timerMode) {
        case 'work':
          newTimeRemaining = settings.workDuration * 60;
          break;
        case 'break':
          newTimeRemaining = settings.breakDuration * 60;
          break;
        case 'longBreak':
          newTimeRemaining = settings.longBreakDuration * 60;
          break;
      }
      
      console.log("Updating timer due to settings change:", {
        mode: timerMode,
        newTime: newTimeRemaining,
        settings
      });
      
      setTimeRemaining(newTimeRemaining);
    }
  }, [settings, timerMode, isRunning]);
  
  return {
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
    saveTimerState
  };
}
