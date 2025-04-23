
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseRestoreTimerStateProps {
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTimerMode: React.Dispatch<React.SetStateAction<TimerMode>>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  onTimerComplete: () => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
}

export function useRestoreTimerState({
  isRunning,
  setIsRunning,
  setTimerMode,
  setTimeRemaining,
  onTimerComplete,
  sessionStartTimeRef
}: UseRestoreTimerStateProps) {
  // This effect should only run once on mount - no dependencies
  useEffect(() => {
    console.log("Restoring timer state on initial load");
    
    // Default to 'work' mode initially
    let initialMode: TimerMode = 'work';
    let shouldAutoStart = false;
    
    const storedStateStr = localStorage.getItem('timerState');
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        console.log("Found stored timer state:", storedState);
        
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        // Always restore the timer mode regardless of running state
        if (storedState.timerMode) {
          initialMode = storedState.timerMode;
          setTimerMode(storedState.timerMode);
          console.log(`Restoring timer mode: ${storedState.timerMode}`);
        }

        // For paused timers, just restore the exact time without calculating elapsed time
        if (!storedState.isRunning) {
          setTimeRemaining(storedState.timeRemaining);
          setIsRunning(false);
          
          // Force UI update
          setTimeout(() => {
            if (window.timerContext && window.timerContext.updateDisplay) {
              window.timerContext.updateDisplay(storedState.timeRemaining);
            }
          }, 10);
          return;
        }

        // For running timers, calculate the new remaining time
        if (storedState.isRunning) {
          if (elapsedSeconds < storedState.timeRemaining) {
            // Timer should still be running with remaining time
            const newTimeRemaining = Math.max(0, storedState.timeRemaining - elapsedSeconds);
            
            // Set the time remaining state
            setTimeRemaining(newTimeRemaining);
            console.log(`Restored running timer with ${newTimeRemaining} seconds remaining`);

            // Set the session start time if it exists
            if (storedState.sessionStartTime) {
              sessionStartTimeRef.current = storedState.sessionStartTime;
              localStorage.setItem('sessionStartTime', storedState.sessionStartTime);
            }
            
            // Don't auto-start the timer immediately
            // Instead, show the correct time but wait for user to press play
            setIsRunning(false);
            shouldAutoStart = false; // Disable auto-start
            
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
              localStorage.setItem('sessionStartTime', storedState.sessionStartTime);
            }
            
            // Call onTimerComplete in the next event loop
            setTimeout(() => onTimerComplete(), 10);
            localStorage.removeItem('timerState');
          }
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        localStorage.removeItem('timerState');
        // Default to work mode on error
        setTimerMode('work');
      }
    } else {
      // Default to 'work' mode if no state is stored
      console.log("No stored state found, defaulting to work mode");
      setTimerMode('work');
    }
  }, []); // Empty dependency array ensures this only runs once
}
