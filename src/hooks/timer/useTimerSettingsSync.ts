
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
    
    // Critical: Don't update time if timer is running or if we have a valid paused time
    if (isRunning) {
      console.log('Timer is running, not updating time after settings change');
      return;
    }
    
    // CRITICAL: Do not override paused time with settings changes
    if (pausedTimeRef.current !== null) {
      console.log('Preserving paused time after settings change:', pausedTimeRef.current);
      return;
    }
    
    // Calculate the new time based on current mode and settings
    const newTime = getTotalTimeForMode();
    console.log('Settings changed: Updating timer to', newTime, 'seconds');
    
    // CRITICAL FIX: Only update displayed time if we don't have a paused time
    setTimeRemaining(newTime);
    console.log('Updating displayed time to match new settings:', newTime);
    
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
