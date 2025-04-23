
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
    // Always ensure we start with isRunning false - user must manually start
    setIsRunning(false);
    
    // Default to work mode if there's no stored state
    let defaultToWorkMode = true;
    
    const storedStateStr = localStorage.getItem('timerState');
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        // Restore the timer mode if available
        if (storedState.timerMode) {
          setTimerMode(storedState.timerMode);
          defaultToWorkMode = false;
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
        defaultToWorkMode = true;
      }
    }
    
    // If no valid state was restored, default to work mode
    if (defaultToWorkMode) {
      setTimerMode('work');
    }
    
    // This must only run on mount
    // eslint-disable-next-line
  }, []);
}
