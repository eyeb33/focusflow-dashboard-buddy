
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
    
    // Set initial time to exactly 25:00 (1500 seconds) - not 24:59
    setTimeRemaining(25 * 60);
    
    // Default to work mode
    setTimerMode('work');
    
    const storedStateStr = localStorage.getItem('timerState');
    console.log("Restoring timer state:", storedStateStr ? "found stored state" : "no stored state");
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        console.log("Parsed stored state:", storedState);
        
        // Set timer mode from storage, default to work
        console.log("Setting timer mode to:", storedState.timerMode || 'work');
        setTimerMode(storedState.timerMode || 'work');

        // If the timer was paused when stored, use the exact stored time
        if (storedState.timeRemaining && typeof storedState.timeRemaining === 'number' && !storedState.isRunning) {
          console.log(`Restoring paused timer with exact time: ${storedState.timeRemaining}`);
          // Ensure we restore exactly the stored time
          setTimeRemaining(storedState.timeRemaining);
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
