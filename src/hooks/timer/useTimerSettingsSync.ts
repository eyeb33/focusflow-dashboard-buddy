
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
    
    // CRITICAL FIX: Always update displayed time to match new settings
    // This ensures settings changes are immediately reflected
    setTimeRemaining(newTime);
    console.log('Updating displayed time to match new settings:', newTime);
    
    // Reset pausedTimeRef to null to ensure we use the new time when starting
    pausedTimeRef.current = null;
    
    // Save the updated state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime, // Use new settings time
      currentSessionIndex,
      sessionStartTime: null,
      pausedTime: null // Important: Reset pausedTime to null
    });
    
    console.log('Timer values updated after settings change:', {
      mode: timerMode,
      newTime,
      isRunning,
      pausedTime: pausedTimeRef.current,
      displayedTime: newTime
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
