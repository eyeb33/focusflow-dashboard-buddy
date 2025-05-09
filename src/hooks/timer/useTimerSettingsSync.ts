
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
    
    // Critical: Don't update time if timer is running OR if we have a paused time
    // This ensures we don't reset the timer after pause
    if (isRunning || pausedTimeRef.current !== null) {
      console.log('Timer is running or paused, not updating time after settings change');
      return;
    }
    
    // Calculate new timer duration based on current mode
    const newTime = getTotalTimeForMode();
    console.log('Settings changed: Updating timer to', newTime, 'seconds');
    
    // Update the timer - only update when settings change, timer is not running and not paused
    setTimeRemaining(newTime);
    
    // Update pausedTimeRef to match new time when settings change
    // This ensures that when we pause/resume after settings change, we use the correct time
    pausedTimeRef.current = null; // Clear pausedTime when settings change and timer is reset
    console.log('Cleared pausedTimeRef after settings change');
    
    // Save the updated state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null,
      pausedTime: null // Explicitly set pausedTime to null in saved state
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
