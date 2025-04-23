
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
    
    // Default to work mode if no stored state
    let initialMode = 'work';
    let initialTime = 25 * 60;
    
    const storedStateStr = localStorage.getItem('timerState');
    console.log("Restoring timer state:", storedStateStr ? "found stored state" : "no stored state");
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        console.log("Parsed stored state:", storedState);
        
        // Set timer mode from storage, default to work
        initialMode = storedState.timerMode || 'work';
        console.log("Setting timer mode to:", initialMode);
        setTimerMode(initialMode);

        // If a time was stored, use it - regardless of whether the timer was running or paused
        if (storedState.timeRemaining && typeof storedState.timeRemaining === 'number') {
          console.log(`Restoring timer with exact time: ${storedState.timeRemaining}`);
          initialTime = storedState.timeRemaining;
          // CRITICAL FIX: Always use the stored time, don't reset to default
          setTimeRemaining(storedState.timeRemaining);
        }

        if (storedState.sessionStartTime) {
          sessionStartTimeRef.current = storedState.sessionStartTime;
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        localStorage.removeItem('timerState');
      }
    } else {
      // Only set the default time if no stored state was found
      setTimeRemaining(initialTime);
      setTimerMode(initialMode);
    }
    
    // This must only run on mount
    // eslint-disable-next-line
  }, []);
}
