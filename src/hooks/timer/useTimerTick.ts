
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
  // Set up the timer interval effect
  useTimerInterval(props);
  
  // Handle visibility change (tab switching)
  useTimerVisibilityHandler(props);
  
  // Handle paused state persistence
  useTimerPausedState(props);
}
