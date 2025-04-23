
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
  // This effect should only run once on mount - no dependencies
  useEffect(() => {
    const storedStateStr = localStorage.getItem('timerState');
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        // Restore the timer state and update the UI
        if (storedState.isRunning) {
          if (elapsedSeconds < storedState.timeRemaining) {
            // Timer should still be running with remaining time
            const newTimeRemaining = Math.max(0, storedState.timeRemaining - elapsedSeconds);
            
            // Set the time remaining state
            setTimeRemaining(newTimeRemaining);

            // Set the session start time if it exists
            if (storedState.sessionStartTime) {
              sessionStartTimeRef.current = storedState.sessionStartTime;
            }
            
            // Force UI update with setTimeout
            setTimeout(() => {
              if (window.timerContext && window.timerContext.updateDisplay) {
                window.timerContext.updateDisplay(newTimeRemaining);
              }
            }, 10);
          } else {
            // Timer has completed while away
            if (storedState.sessionStartTime) {
              sessionStartTimeRef.current = storedState.sessionStartTime;
            }
            
            // Call onTimerComplete in the next event loop
            setTimeout(() => onTimerComplete(), 10);
            localStorage.removeItem('timerState');
          }
        } else {
          // Timer was paused, just restore the time
          setTimeRemaining(storedState.timeRemaining);
          
          // Force UI update
          setTimeout(() => {
            if (window.timerContext && window.timerContext.updateDisplay) {
              window.timerContext.updateDisplay(storedState.timeRemaining);
            }
          }, 10);
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        localStorage.removeItem('timerState');
      }
    }
  }, []); // Empty dependency array ensures this only runs once
}
