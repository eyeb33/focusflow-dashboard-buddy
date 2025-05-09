
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { logTimerStateChange } from '@/utils/timerDebugUtils';

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
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
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
    console.log('START called with mode:', timerMode, 'time:', timeRemaining, 'pausedTime:', pausedTimeRef.current);
    
    // Log state before change
    logTimerStateChange('start', 
      { isRunning, timeRemaining, pausedTime: pausedTimeRef.current },
      { isRunning: true, timeRemaining, pausedTime: null }
    );
    
    // If timer is already running, do nothing
    if (isRunning) {
      console.log('Timer already running, ignoring start call');
      return;
    }

    // Check if we're resuming from a paused state and use that time if available
    if (pausedTimeRef.current !== null) {
      console.log('Resuming from paused time:', pausedTimeRef.current);
      setTimeRemaining(pausedTimeRef.current);
    } else {
      console.log('No paused time available, using current time:', timeRemaining);
    }
    
    // Critical: Set running state AFTER updating time if needed
    setIsRunning(true);
    
    // Ensure we have a session start time
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    
    // Get final time to use for logging and state saving
    const finalTimeToUse = pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining;
    
    // Clear the paused time after using it
    pausedTimeRef.current = null;
    
    // Save the timer state with the current time
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining: finalTimeToUse,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current
    });
    
    console.log("Timer started with mode:", timerMode, "and time:", finalTimeToUse);
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, pausedTimeRef, 
      sessionStartTimeRef, setIsRunning, setTimeRemaining, saveTimerState]);
  
  const handlePause = useCallback(() => {
    console.log('PAUSE called with time remaining:', timeRemaining);
    
    // If timer is not running, do nothing
    if (!isRunning) {
      console.log('Timer not running, ignoring pause call');
      return;
    }
    
    // Log state before change
    logTimerStateChange('pause',
      { isRunning, timeRemaining, pausedTime: pausedTimeRef.current },
      { isRunning: false, timeRemaining, pausedTime: timeRemaining }
    );
    
    // Store the current time when pausing - this is CRITICAL
    pausedTimeRef.current = timeRemaining;
    console.log('Storing exact pause time:', timeRemaining);
    
    // Stop the timer
    setIsRunning(false);
    
    // Save the timer state with the paused time
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      pausedTime: timeRemaining // Explicitly include pausedTime in saved state
    });
    
    console.log("Timer paused at:", timeRemaining);
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, saveTimerState, 
      setIsRunning, pausedTimeRef, sessionStartTimeRef]);
  
  const handleReset = useCallback(() => {
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
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
