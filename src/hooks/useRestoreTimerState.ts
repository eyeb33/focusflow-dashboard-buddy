
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
    // CRITICAL: Always ensure we start with isRunning false - user must manually start
    setIsRunning(false);
    
    // Default to work mode if there's no stored state
    let defaultToWorkMode = true;
    
    const storedStateStr = localStorage.getItem('timerState');
    console.log("Restoring timer state:", storedStateStr ? "found stored state" : "no stored state");
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        // Restore the timer mode if available
        if (storedState.timerMode) {
          // FORCE to 'work' mode for now to fix UI issues
          console.log("Forcing timer to work mode for consistency");
          setTimerMode('work');
          defaultToWorkMode = false;
        } else {
          // If no timer mode is stored, explicitly set to work mode
          console.log("No timer mode found in stored state, defaulting to work mode");
          setTimerMode('work');
        }

        // Restore time remaining but NEVER auto-start
        if (storedState.timeRemaining > 0) {
          // Calculate new time remaining, accounting for elapsed time while away
          let newTimeRemaining;
          
          // If the timer was paused when stored, don't subtract elapsed time
          if (storedState.isRunning === false) {
            newTimeRemaining = storedState.timeRemaining;
            console.log("Restoring paused timer with time:", newTimeRemaining);
          } else {
            // If timer was running, subtract elapsed time
            newTimeRemaining = Math.max(0, storedState.timeRemaining - elapsedSeconds);
            console.log("Restoring running timer adjusted for elapsed time:", newTimeRemaining);
          }
          
          setTimeRemaining(newTimeRemaining);

          if (storedState.sessionStartTime) {
            sessionStartTimeRef.current = storedState.sessionStartTime;
          }
          
          // Handle timer completion if time elapsed while away
          if (newTimeRemaining <= 0 && storedState.isRunning !== false) {
            console.log("Timer completed while away, triggering completion");
            if (storedState.sessionStartTime) {
              sessionStartTimeRef.current = storedState.sessionStartTime;
            }
            setTimeout(() => onTimerComplete(), 0);
            localStorage.removeItem('timerState');
          }
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        localStorage.removeItem('timerState');
        defaultToWorkMode = true;
      }
    }
    
    // If no valid state was restored or there was an error, default to work mode
    if (defaultToWorkMode) {
      console.log("Defaulting to work mode");
      setTimerMode('work');
    }
    
    // This must only run on mount
    // eslint-disable-next-line
  }, []);
}
