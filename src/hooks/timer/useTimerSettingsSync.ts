
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
  timeRemaining: number; 
}

export function useTimerSettingsSync({
  isInitialLoadRef,
  isRunning,
  timerMode,
  pausedTimeRef,
  getTotalTimeForMode,
  setTimeRemaining,
  saveTimerState,
  currentSessionIndex,
  timeRemaining
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
    
    // Calculate the new time based on current mode and settings
    const newTime = getTotalTimeForMode();
    console.log('Settings changed: Updating timer to', newTime, 'seconds');
    
    // CRITICAL FIX: Don't override timeRemaining here - we want to preserve manually set times
    // This ensures settings changes don't interfere with slider adjustments
    // Only update if we're at the default time for this mode
    const currentDefaultTime = getTotalTimeForMode();
    const shouldUpdateDisplay = Math.abs(timeRemaining - currentDefaultTime) < 2; // Allow 1 second difference due to rounding
    
    if (shouldUpdateDisplay) {
      // Update the timer display
      setTimeRemaining(newTime);
      console.log('Updating displayed time to match new settings:', newTime);
    } else {
      console.log('Keeping displayed time at current value:', timeRemaining);
    }
    
    // Always update pausedTimeRef to match current time
    pausedTimeRef.current = timeRemaining;
    
    // Save the updated state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: timeRemaining, // Use current time, not necessarily the new settings time
      currentSessionIndex,
      sessionStartTime: null,
      pausedTime: timeRemaining // Match pausedTime with current display
    });
    
    console.log('Timer values updated after settings change:', {
      mode: timerMode,
      newTime,
      isRunning,
      pausedTime: pausedTimeRef.current,
      displayedTime: timeRemaining
    });
    
  }, [
    getTotalTimeForMode, 
    isInitialLoadRef, 
    isRunning, 
    saveTimerState, 
    setTimeRemaining, 
    currentSessionIndex, 
    timerMode,
    pausedTimeRef,
    timeRemaining
  ]);
}
