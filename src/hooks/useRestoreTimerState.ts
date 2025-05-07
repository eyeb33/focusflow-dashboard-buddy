
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
    
    // Always ensure we start with isRunning false on page load
    setIsRunning(false);
    
    // IMPORTANT: Clear ALL stored timer states to prevent persistence issues
    localStorage.removeItem('timerState');
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('timerStateBeforeUnload');
    localStorage.removeItem('pausedTime');
    
    // Default to work mode with standard duration on page refresh
    setTimerMode('work');
    
    // Default to the settings duration (this will be adjusted by useTimerSettings)
    const settings = JSON.parse(localStorage.getItem('timerSettings') || '{"workDuration":25}');
    const initialTime = (settings.workDuration || 25) * 60;
    setTimeRemaining(initialTime);
    
    console.log(`Timer reset to initial state: mode=work, isRunning=false, time=${initialTime}`);
    
    // This must only run on mount
    // eslint-disable-next-line
  }, []);
}
