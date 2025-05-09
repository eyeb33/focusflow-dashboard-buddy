
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
  
  // Effect to sync timer with settings changes
  useEffect(() => {
    // Skip during initial load to prevent overriding restored state
    if (isInitialLoadRef.current) {
      console.log('Initial load detected, skipping settings sync');
      isInitialLoadRef.current = false; // Reset the flag after first run
      return;
    }
    
    // Critical: Don't update time if timer is running
    if (isRunning) {
      console.log('Timer is running, not updating time after settings change');
      return;
    }
    
    // Critical: Store the new time in pausedTimeRef when settings change and we're paused
    const newTime = getTotalTimeForMode();
    console.log('Settings changed: Updating timer to', newTime, 'seconds');
    
    // Update the timer
    setTimeRemaining(newTime);
    
    // IMPORTANT: When settings change while paused, update the pausedTimeRef to match
    // This ensures that when play is pressed, it will use this new time
    if (pausedTimeRef.current !== null) {
      console.log('Timer was paused, updating pausedTimeRef to new time:', newTime);
      pausedTimeRef.current = newTime;
    }
    
    // Save the updated state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null,
      pausedTime: newTime // Critical: Use new time as pausedTime to ensure it resumes from this time
    });
    
    console.log('Timer values updated after settings change:', {
      mode: timerMode,
      newTime,
      isRunning,
      pausedTime: pausedTimeRef.current
    });
    
  }, [
    getTotalTimeForMode, 
    isInitialLoadRef, 
    isRunning, 
    saveTimerState, 
    setTimeRemaining, 
    currentSessionIndex, 
    timerMode,
    pausedTimeRef
  ]);
}
