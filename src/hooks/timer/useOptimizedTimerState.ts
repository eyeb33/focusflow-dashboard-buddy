
import { useState, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export interface OptimizedTimerState {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  completedSessions: number;
  totalTimeToday: number;
  currentSessionIndex: number;
}

export function useOptimizedTimerState(settings: TimerSettings) {
  const [state, setState] = useState<OptimizedTimerState>({
    timerMode: 'work',
    isRunning: false,
    timeRemaining: settings.workDuration * 60,
    completedSessions: 0,
    totalTimeToday: 0,
    currentSessionIndex: 0
  });

  // Refs for timer management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<string | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);
  const targetEndTimeRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const isTransitioningRef = useRef(false);

  return {
    state,
    setState,
    refs: {
      timerRef,
      lastTickTimeRef,
      sessionStartTimeRef,
      lastRecordedFullMinutesRef,
      targetEndTimeRef,
      isInitializedRef,
      isTransitioningRef
    }
  };
}
