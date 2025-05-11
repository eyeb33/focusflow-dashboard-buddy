
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
  timeRemaining: number; // Required property based on the error
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
  timeRemaining // Add this parameter
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
    
    // Update the pausedTimeRef to match new settings time
    pausedTimeRef.current = newTime;
    console.log('Updating pausedTimeRef to match new settings time:', newTime);
    
    // Only update the timer display if we don't have an active paused time
    // or if displayed time doesn't match the mode duration (likely after settings change)
    const shouldUpdateDisplay = timeRemaining === getTotalTimeForMode();
    
    if (shouldUpdateDisplay) {
      // Update the timer display
      setTimeRemaining(newTime);
      console.log('Updating displayed time to match new settings:', newTime);
    } else {
      console.log('Keeping displayed time at current value:', timeRemaining);
    }
    
    // Save the updated state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: shouldUpdateDisplay ? newTime : timeRemaining,
      currentSessionIndex,
      sessionStartTime: null,
      pausedTime: newTime // Critical: Use new time as pausedTime to ensure it resumes from this time
    });
    
    console.log('Timer values updated after settings change:', {
      mode: timerMode,
      newTime,
      isRunning,
      pausedTime: pausedTimeRef.current,
      displayedTime: shouldUpdateDisplay ? newTime : timeRemaining
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
    timeRemaining // Added dependency
  ]);
}
