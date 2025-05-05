
import { useState, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

export interface TimerStateOptions {
  initialMode?: TimerMode;
  initialTime?: number;
}

export function useTimerState(options: TimerStateOptions = {}) {
  const [timerMode, setTimerMode] = useState<TimerMode>(options.initialMode || 'work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(options.initialTime || 1500); // Default 25 minutes
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // References for timer management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<string | null>(null);
  const pausedTimeRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  
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
    timerRef,
    lastTickTimeRef,
    sessionStartTimeRef,
    pausedTimeRef,
    isInitialLoadRef
  };
}
