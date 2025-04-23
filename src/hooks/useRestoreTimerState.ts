
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
    
    // Always start with workDuration * 60 (which should be 1500 seconds or 25:00)
    setTimeRemaining(25 * 60);
    
    // Default to work mode
    setTimerMode('work');
    
    const storedStateStr = localStorage.getItem('timerState');
    console.log("Restoring timer state:", storedStateStr ? "found stored state" : "no stored state");
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        console.log("Parsed stored state:", storedState);
        
        // ALWAYS default to work mode first
        console.log("Setting timer mode to:", storedState.timerMode || 'work');
        setTimerMode(storedState.timerMode || 'work');

        // Calculate elapsed time if needed
        if (storedState.isRunning) {
          const elapsedMs = Date.now() - storedState.timestamp;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          console.log(`Time elapsed since storage: ${elapsedSeconds} seconds`);
          
          // If the timer was running, subtract elapsed time (capped at 0)
          if (storedState.timeRemaining && typeof storedState.timeRemaining === 'number') {
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
        } else {
          // If the timer was paused when stored, use the exact stored time
          if (storedState.timeRemaining && typeof storedState.timeRemaining === 'number') {
            console.log(`Restoring paused timer with exact time: ${storedState.timeRemaining}`);
            setTimeRemaining(storedState.timeRemaining);
          }
        }

        if (storedState.sessionStartTime) {
          sessionStartTimeRef.current = storedState.sessionStartTime;
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
