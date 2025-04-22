
import { useEffect } from 'react';

interface UseRestoreTimerStateProps {
  isRunning: boolean;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  onTimerComplete: () => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
}

export function useRestoreTimerState({
  isRunning,
  setTimeRemaining,
  onTimerComplete,
  sessionStartTimeRef
}: UseRestoreTimerStateProps) {
  useEffect(() => {
    const storedStateStr = localStorage.getItem('timerState');
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        if (storedState.isRunning && elapsedSeconds < storedState.timeRemaining) {
          const newTimeRemaining = Math.max(0, storedState.timeRemaining - elapsedSeconds);
          setTimeRemaining(newTimeRemaining);

          if (storedState.sessionStartTime) {
            sessionStartTimeRef.current = storedState.sessionStartTime;
          }
        } else if (storedState.isRunning && elapsedSeconds >= storedState.timeRemaining) {
          if (storedState.sessionStartTime) {
            sessionStartTimeRef.current = storedState.sessionStartTime;
          }
          setTimeout(() => onTimerComplete(), 0);
          localStorage.removeItem('timerState');
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        localStorage.removeItem('timerState');
      }
    }
    // This must only run on mount
    // eslint-disable-next-line
  }, []);
}
