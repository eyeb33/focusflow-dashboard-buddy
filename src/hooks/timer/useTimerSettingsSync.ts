
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseTimerSettingsSyncProps {
  isInitialLoadRef: React.MutableRefObject<boolean>;
  isRunning: boolean;
  timerMode: TimerMode;
  pausedTimeRef: React.MutableRefObject<number | null>;
  getTotalTimeForMode: () => number;
  setTimeRemaining: (time: number) => void;
  saveTimerState: (state: any) => void;
  currentSessionIndex: number;
}

export function useTimerSettingsSync({
  isInitialLoadRef,
  isRunning,
  timerMode,
  pausedTimeRef,
  getTotalTimeForMode,
  setTimeRemaining,
  saveTimerState,
  currentSessionIndex
}: UseTimerSettingsSyncProps) {
  // Update timer when settings change (when not running)
  useEffect(() => {
    // Skip the initial render to avoid conflicts with state restoration
    if (isInitialLoadRef.current) {
      console.log("Initial load detected, skipping settings sync");
      return;
    }
    
    // Only update if the timer is not running
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      console.log(`Settings changed: Updating timer to ${newTime} seconds`);
      
      // Important: Always update the timer value when settings change 
      // and the timer is not running, regardless of pause state
      setTimeRemaining(newTime);
      pausedTimeRef.current = null; // Reset the pause state
      
      // Save the updated state
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: newTime,
        currentSessionIndex,
        sessionStartTime: null
      });
      
      console.log("Timer values updated after settings change:", { 
        mode: timerMode,
        newTime,
        isRunning
      });
    }
  }, [
    timerMode, 
    isRunning, 
    currentSessionIndex, 
    getTotalTimeForMode, 
    saveTimerState, 
    isInitialLoadRef, 
    setTimeRemaining, 
    pausedTimeRef
  ]);
}
