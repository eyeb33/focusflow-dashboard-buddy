
import { useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useTimerVisibilityHandler } from './useTimerVisibilityHandler';
import { useTimerInterval } from './useTimerInterval';
import { useTimerPausedState } from './useTimerPausedState';

interface TimerTickParams {
  isRunning: boolean;
  timerMode: TimerMode;
  timeRemaining: number;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  lastTickTimeRef: React.MutableRefObject<number>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  handleTimerComplete: () => void;
  saveTimerState: (state: any) => void;
  currentSessionIndex: number;
}

export function useTimerTick({
  isRunning,
  timerMode,
  timeRemaining,
  setTimeRemaining,
  timerRef,
  lastTickTimeRef,
  sessionStartTimeRef,
  pausedTimeRef,
  handleTimerComplete,
  saveTimerState,
  currentSessionIndex
}: TimerTickParams) {
  
  // Performance monitoring for debugging
  const renderTimestampRef = useRef(Date.now());
  const renderCount = useRef(0);
  
  // Debug logging with performance info
  renderCount.current++;
  const now = Date.now();
  const elapsed = now - renderTimestampRef.current;
  console.log(`useTimerTick - Render #${renderCount.current} after ${elapsed}ms - Current state: isRunning=${isRunning}, time=${timeRemaining}, pausedTime=${pausedTimeRef.current}`);
  renderTimestampRef.current = now;
  
  // Handle timer visibility changes (tab switching, etc)
  useTimerVisibilityHandler({
    isRunning,
    timeRemaining,
    setTimeRemaining,
    lastTickTimeRef,
    handleTimerComplete
  });
  
  // Handle paused state changes
  const { justResumedRef, preservePausedTimeRef } = useTimerPausedState({
    isRunning,
    timeRemaining,
    pausedTimeRef,
    setTimeRemaining
  });
  
  // Setup core timer interval with improved accuracy
  useTimerInterval({
    isRunning,
    timeRemaining,
    setTimeRemaining,
    timerRef,
    lastTickTimeRef,
    handleTimerComplete,
    saveTimerState,
    timerMode,
    currentSessionIndex,
    sessionStartTimeRef
  });
  
  return;
}
