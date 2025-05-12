
import { useEffect, useRef } from 'react';
import { useTimerInterval } from './useTimerInterval';
import { useTimerPausedState } from './useTimerPausedState';
import { useTimerVisibilityHandler } from './useTimerVisibilityHandler';

interface UseTimerTickProps {
  isRunning: boolean;
  timeRemaining: number;
  timerMode: string;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  lastTickTimeRef: React.MutableRefObject<number>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  handleTimerComplete: () => void;
  saveTimerState: (state: any) => void;
  currentSessionIndex: number;
}

export function useTimerTick(props: UseTimerTickProps) {
  // Performance monitoring for debugging
  const renderTimestampRef = useRef(Date.now());
  const renderCount = useRef(0);
  
  // Debug logging with performance info
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const elapsed = now - renderTimestampRef.current;
    console.log(`useTimerTick - Render #${renderCount.current} after ${elapsed}ms - Current state: isRunning=${props.isRunning}, time=${props.timeRemaining}, pausedTime=${props.pausedTimeRef.current}`);
    renderTimestampRef.current = now;
  }, [props.isRunning, props.timeRemaining, props.pausedTimeRef]);
  
  // Set up the timer interval effect
  useTimerInterval(props);
  
  // Handle visibility change (tab switching)
  useTimerVisibilityHandler(props);
  
  // Handle paused state persistence
  useTimerPausedState(props);
}
