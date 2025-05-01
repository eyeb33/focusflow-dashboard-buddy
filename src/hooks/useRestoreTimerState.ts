
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
  setTimerMode
}: UseRestoreTimerStateProps) {
  useEffect(() => {
    console.log("========== RESTORING TIMER STATE ==========");
    // CRITICAL: Always ensure we start with isRunning false - user must manually start
    setIsRunning(false);
    
    // Default to work mode if no stored state
    let initialMode: TimerMode = 'work';
    
    const storedStateStr = localStorage.getItem('timerState');
    console.log("Restoring timer state:", storedStateStr ? "found stored state" : "no stored state");
    
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        console.log("Parsed stored state:", storedState);
        
        // Set timer mode from storage, default to work
        initialMode = (storedState.timerMode || 'work') as TimerMode;
        console.log("Setting timer mode to:", initialMode);
        setTimerMode(initialMode);

        // CRITICAL FIX: Always use the stored time, don't reset to default
        if (storedState.timeRemaining && typeof storedState.timeRemaining === 'number') {
          console.log(`Restoring timer with exact time: ${storedState.timeRemaining}`);
          setTimeRemaining(storedState.timeRemaining);
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
