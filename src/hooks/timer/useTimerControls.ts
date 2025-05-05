
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface TimerControlsParams {
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  currentSessionIndex: number;
  setCurrentSessionIndex: (index: number) => void;
  settings: TimerSettings;
  saveTimerState: (state: any) => void;
}

export function useTimerControls({
  timerMode,
  setTimerMode,
  isRunning,
  setIsRunning,
  timeRemaining,
  setTimeRemaining,
  sessionStartTimeRef,
  pausedTimeRef,
  currentSessionIndex,
  setCurrentSessionIndex,
  settings,
  saveTimerState
}: TimerControlsParams) {
  
  const handleStart = useCallback(() => {
    console.log('START called with mode:', timerMode, 'and time:', timeRemaining, 'pausedTime:', pausedTimeRef.current);
    
    // Set timer running state first
    setIsRunning(true);
    
    // Save the timer state
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining: pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current || new Date().toISOString()
    });
  }, [timerMode, timeRemaining, currentSessionIndex, saveTimerState, setIsRunning, pausedTimeRef, sessionStartTimeRef]);
  
  const handlePause = useCallback(() => {
    console.log('PAUSE called with time:', timeRemaining);
    
    // Stop the timer immediately
    setIsRunning(false);
    
    // Store the current time when pausing
    pausedTimeRef.current = timeRemaining;
    console.log('Storing exact pause time:', timeRemaining);
    
    // Save the timer state with the paused time
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current
    });
  }, [timerMode, timeRemaining, currentSessionIndex, saveTimerState, setIsRunning, pausedTimeRef, sessionStartTimeRef]);
  
  const handleReset = useCallback(() => {
    console.log('RESET called for mode:', timerMode);
    
    // Stop the timer
    setIsRunning(false);
    
    // Reset to the full time for current mode
    const newTime = (() => {
      switch(timerMode) {
        case 'work': return settings.workDuration * 60;
        case 'break': return settings.breakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
        default: return settings.workDuration * 60;
      }
    })();
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
      sessionStartTime: null
    });
  }, [timerMode, settings, currentSessionIndex, saveTimerState, setIsRunning, setTimeRemaining, sessionStartTimeRef, pausedTimeRef]);
  
  const handleModeChange = useCallback((mode: TimerMode) => {
    console.log('MODE CHANGE called from', timerMode, 'to', mode);
    
    // Stop the timer first
    setIsRunning(false);
    
    // Update mode
    setTimerMode(mode);
    
    // Reset session index when manually changing to work mode
    if (mode === 'work') {
      setCurrentSessionIndex(0);
    }
    
    // Clear pause time on mode change
    pausedTimeRef.current = null;
    
    // Set the appropriate time for the new mode
    const newTime = (() => {
      switch(mode) {
        case 'work': return settings.workDuration * 60;
        case 'break': return settings.breakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
        default: return settings.workDuration * 60;
      }
    })();
    
    setTimeRemaining(newTime);
    
    // Clear session start time
    sessionStartTimeRef.current = null;
    
    // Save the new state
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : currentSessionIndex,
      sessionStartTime: null
    });
  }, [timerMode, settings, currentSessionIndex, setTimerMode, setCurrentSessionIndex, saveTimerState, setIsRunning, setTimeRemaining, sessionStartTimeRef, pausedTimeRef]);
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
