
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
  // Update timer when settings change (when not running)
  useEffect(() => {
    if (isInitialLoadRef.current) {
      console.log("Initial load detected, skipping settings sync");
      isInitialLoadRef.current = false;
      return;
    }
    
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      console.log(`Settings changed: Updating timer to ${newTime} seconds`);
      
      // Don't update if it was just paused (preserve paused time)
      if (pausedTimeRef.current !== null) {
        console.log('Not updating time due to recent pause. Keeping:', pausedTimeRef.current);
        return;
      }
      
      setTimeRemaining(newTime);
      
      // Save the updated state
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: newTime,
        currentSessionIndex,
        sessionStartTime: null
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
