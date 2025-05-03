
import { useState } from 'react';
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
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
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
