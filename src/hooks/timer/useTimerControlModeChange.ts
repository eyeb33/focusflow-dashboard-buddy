
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface UseTimerControlModeChangeProps {
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  setIsRunning: (running: boolean) => void;
  setTimeRemaining: (time: number) => void;
  pausedTimeRef: React.MutableRefObject<number | null>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  currentSessionIndex: number;
  setCurrentSessionIndex: (index: number) => void;
  settings: TimerSettings;
  saveTimerState: (state: any) => void;
}

export function useTimerControlModeChange({
  timerMode,
  setTimerMode,
  setIsRunning,
  setTimeRemaining,
  pausedTimeRef,
  sessionStartTimeRef,
  currentSessionIndex,
  setCurrentSessionIndex,
  settings,
  saveTimerState
}: UseTimerControlModeChangeProps) {
  
  return useCallback((mode: TimerMode) => {
    console.log('MODE CHANGE called from', timerMode, 'to', mode);
    
    // Stop the timer first
    setIsRunning(false);
    
    // Update mode
    setTimerMode(mode);
    
    // Reset session index when manually changing to work mode
    if (mode === 'work') {
      setCurrentSessionIndex(0);
    }
    
    // Calculate the appropriate time for the new mode
    const newTime = (() => {
      switch(mode) {
        case 'work': return settings.workDuration * 60;
        case 'break': return settings.breakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
        default: return settings.workDuration * 60;
      }
    })();
    
    // Clear paused time
    pausedTimeRef.current = null;
    
    // Set new time
    setTimeRemaining(newTime);
    
    // Clear session start time
    sessionStartTimeRef.current = null;
    
    // Save the new state
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : currentSessionIndex,
      sessionStartTime: null,
      pausedTime: null // Explicitly set pausedTime to null when changing mode
    });
    
    console.log("Mode changed to:", mode, "with time:", newTime);
  }, [timerMode, settings, currentSessionIndex, setTimerMode, setCurrentSessionIndex, saveTimerState, 
      setIsRunning, setTimeRemaining, sessionStartTimeRef, pausedTimeRef]);
}
