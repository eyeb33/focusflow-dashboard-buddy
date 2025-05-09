
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
    
    // Don't update time if timer is running
    if (isRunning) {
      console.log('Timer is running, not updating time after settings change');
      return;
    }
    
    // Calculate new timer duration based on current mode
    const newTime = getTotalTimeForMode();
    console.log('Settings changed: Updating timer to', newTime, 'seconds');
    
    // Update the timer - only update when settings change, timer is not running
    setTimeRemaining(newTime);
    
    // Update pausedTimeRef to match new time when settings change
    // This ensures that when we pause/resume after settings change, we use the correct time
    pausedTimeRef.current = newTime;
    console.log('Updated pausedTimeRef to match new time after settings change:', newTime);
    
    // Save the updated state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null,
      pausedTime: newTime // Explicitly include pausedTime in saved state
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
