
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { logTimerStateChange } from '@/utils/timerDebugUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface UseTimerControlResetProps {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (running: boolean) => void;
  setTimeRemaining: (time: number) => void;
  pausedTimeRef: React.MutableRefObject<number | null>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  currentSessionIndex: number;
  settings: TimerSettings;
  saveTimerState: (state: any) => void;
}

export function useTimerControlReset({
  timerMode,
  isRunning,
  timeRemaining,
  setIsRunning,
  setTimeRemaining,
  pausedTimeRef,
  sessionStartTimeRef,
  currentSessionIndex,
  settings,
  saveTimerState
}: UseTimerControlResetProps) {
  
  return useCallback(() => {
    console.log('RESET called for mode:', timerMode);
    
    // Calculate the new time based on the current mode
    const newTime = (() => {
      switch(timerMode) {
        case 'work': return settings.workDuration * 60;
        case 'break': return settings.breakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
        default: return settings.workDuration * 60;
      }
    })();
    
    // Log state before change
    logTimerStateChange('reset',
      { isRunning, timeRemaining, pausedTime: pausedTimeRef.current },
      { isRunning: false, timeRemaining: newTime, pausedTime: null }
    );
    
    // Stop the timer
    setIsRunning(false);
    
    // Reset to the full time for current mode
    setTimeRemaining(newTime);
    
    // Clear session start time and pause time
    sessionStartTimeRef.current = null;
    pausedTimeRef.current = null;
    
    // Save the reset state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null,
      pausedTime: null // Explicitly set pausedTime to null when resetting
    });
    
    console.log("Timer reset to:", newTime, "seconds");
  }, [timerMode, settings, isRunning, timeRemaining, currentSessionIndex, saveTimerState, 
      setIsRunning, setTimeRemaining, sessionStartTimeRef, pausedTimeRef]);
}
