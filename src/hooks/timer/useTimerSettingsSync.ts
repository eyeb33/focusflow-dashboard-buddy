
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
      console.log("[useTimerSettingsSync] Initial load detected, skipping settings sync");
      isInitialLoadRef.current = false;
      return;
    }
    
    // Only update if the timer is not running
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      console.log(`[useTimerSettingsSync] Settings changed: Updating timer to ${newTime} seconds`);
      console.log(`[useTimerSettingsSync] BEFORE update: pausedTimeRef =`, pausedTimeRef.current);
      
      // Update time remaining
      setTimeRemaining(newTime);
      
      // CRITICAL: Set pausedTimeRef to null so the timer uses
      // the updated timeRemaining value instead of an old paused value
      const previousPausedTime = pausedTimeRef.current;
      pausedTimeRef.current = null;
      console.log('[useTimerSettingsSync] Clearing paused time after settings change, was:', previousPausedTime);
      
      // Save the updated state
      const stateToSave = {
        timerMode,
        isRunning: false,
        timeRemaining: newTime,
        currentSessionIndex,
        sessionStartTime: null
      };
      console.log('[useTimerSettingsSync] Saving timer state after settings change:', stateToSave);
      saveTimerState(stateToSave);
      
      console.log("[useTimerSettingsSync] Timer values updated after settings change:", { 
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
