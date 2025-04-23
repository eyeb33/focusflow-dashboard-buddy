
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
    console.log("========== RESTORING TIMER STATE ==========");
    // CRITICAL: Always ensure we start with isRunning false - user must manually start
    setIsRunning(false);
    
    // Default to work mode if there's no stored state
    let defaultToWorkMode = true;
    
    const storedStateStr = localStorage.getItem('timerState');
    console.log("Restoring timer state:", storedStateStr ? "found stored state" : "no stored state");
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        console.log("Parsed stored state:", storedState);
        
        // Calculate elapsed time if needed
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        console.log(`Time elapsed since storage: ${elapsedSeconds} seconds`);

        // ALWAYS set to work mode first to avoid UI issues
        console.log("Setting timer mode to 'work'");
        setTimerMode('work');
        defaultToWorkMode = false;

        // Restore time remaining but NEVER auto-start
        if (storedState.timeRemaining && typeof storedState.timeRemaining === 'number') {
          // If the timer was paused when stored, use the exact stored time
          if (storedState.isRunning === false) {
            console.log(`Restoring paused timer with exact time: ${storedState.timeRemaining}`);
            setTimeRemaining(storedState.timeRemaining);
          } else {
            // If timer was running, subtract elapsed time (capped at 0)
            const newTimeRemaining = Math.max(0, storedState.timeRemaining - elapsedSeconds);
            console.log(`Restoring previously running timer, adjusted time: ${newTimeRemaining}`);
            setTimeRemaining(newTimeRemaining);
            
            // Handle completion if time elapsed while away
            if (newTimeRemaining <= 0) {
              console.log("Timer completed while away, triggering completion");
              setTimeout(() => onTimerComplete(), 0);
              localStorage.removeItem('timerState');
            }
          }

          if (storedState.sessionStartTime) {
            sessionStartTimeRef.current = storedState.sessionStartTime;
          }
        } else {
          console.log("No valid timeRemaining in stored state, using default work duration");
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
