
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseRestoreTimerStateProps {
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  onTimerComplete: () => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  setTimerMode: React.Dispatch<React.SetStateAction<TimerMode>>;
}

export function useRestoreTimerState({
  setIsRunning,
  setTimeRemaining,
  onTimerComplete,
  sessionStartTimeRef,
  setTimerMode
}: UseRestoreTimerStateProps) {
  useEffect(() => {
    const storedStateStr = localStorage.getItem('timerState');
    
    // Always ensure we start with isRunning false - user must manually start
    setIsRunning(false);
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        // Restore the timer mode if available
        if (storedState.timerMode) {
          setTimerMode(storedState.timerMode);
        }

        // Restore time remaining but don't auto-start
        if (elapsedSeconds < storedState.timeRemaining) {
          const newTimeRemaining = Math.max(0, storedState.timeRemaining - elapsedSeconds);
          setTimeRemaining(newTimeRemaining);

          if (storedState.sessionStartTime) {
            sessionStartTimeRef.current = storedState.sessionStartTime;
          }
        } else if (elapsedSeconds >= storedState.timeRemaining) {
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
