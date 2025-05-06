
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseTimerSettingsSyncProps {
  isInitialLoadRef: React.MutableRefObject<boolean>;
  isRunning: boolean;
  timerMode: TimerMode;
  pausedTimeRef: React.MutableRefObject<number | null>;
  getTotalTimeForMode: () => number;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
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
  useEffect(() => {
    // Skip the initial render
    if (isInitialLoadRef.current) {
      console.log("Initial load detected, skipping settings sync");
      isInitialLoadRef.current = false;
      return;
    }
    
    // Only update if the timer is not running
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      console.log(`Settings changed: Updating timer to ${newTime} seconds`);
      
      // Update time remaining
      setTimeRemaining(newTime);
      
      // Important: Set pausedTimeRef to the new time so the timer can be started
      pausedTimeRef.current = newTime;
      console.log('Setting paused time to new duration:', newTime);
      
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
        isRunning,
        pausedTime: pausedTimeRef.current
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
