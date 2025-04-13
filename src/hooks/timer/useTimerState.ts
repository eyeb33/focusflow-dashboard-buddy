
import { useState } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';

export function useTimerState(settings: TimerSettings) {
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [autoStart, setAutoStart] = useState(false);
  
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
    autoStart,
    setAutoStart
  };
}
