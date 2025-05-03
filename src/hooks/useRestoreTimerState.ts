
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
    console.log("========== INITIALIZING TIMER STATE ==========");
    
    // CRITICAL: Always ensure we start with isRunning false on page load
    setIsRunning(false);
    
    // Default to work mode on page refresh
    let initialMode: TimerMode = 'work';
    setTimerMode(initialMode);
    
    // Clear any stored timer state to ensure fresh start on page reload
    localStorage.removeItem('timerState');
    
    console.log("Timer reset to initial state: mode=work, isRunning=false");
    
    // This must only run on mount
    // eslint-disable-next-line
  }, []);
}
