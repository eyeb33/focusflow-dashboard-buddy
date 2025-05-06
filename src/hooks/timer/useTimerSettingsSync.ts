
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
      
      // CRITICAL: Set pausedTimeRef to the new time so the timer can be started
      // This is the key fix - ensure the pausedTimeRef is set to null so the timer uses
      // the updated timeRemaining value instead of an old paused value
      pausedTimeRef.current = null;
      console.log('Clearing paused time after settings change');
      
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
