
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
    let initialMode: TimerMode = 'work';
    let initialTime = 25 * 60;
    
    const storedStateStr = localStorage.getItem('timerState');
    console.log("Restoring timer state:", storedStateStr ? "found stored state" : "no stored state");
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        console.log("Parsed stored state:", storedState);
        
        // Set timer mode from storage, default to work
        // Ensure we cast the stored mode to TimerMode type
        initialMode = (storedState.timerMode || 'work') as TimerMode;
        console.log("Setting timer mode to:", initialMode);
        setTimerMode(initialMode);

        // CRITICAL FIX: Always use the stored time, don't reset to default
        if (storedState.timeRemaining && typeof storedState.timeRemaining === 'number') {
          console.log(`Restoring timer with exact time: ${storedState.timeRemaining}`);
          // Use the stored time directly without any modifications
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
      setTimerMode(initialMode as TimerMode);
    }
    
    // This must only run on mount
    // eslint-disable-next-line
  }, []);
}
