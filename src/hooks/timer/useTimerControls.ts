
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
    console.log('[useTimerControls] START called with:', { 
      mode: timerMode, 
      timeRemaining, 
      pausedTimeRef: pausedTimeRef.current,
      isRunning
    });
    
    // If timer is already running, don't do anything
    if (isRunning) {
      console.log('[useTimerControls] Timer already running, ignoring start request');
      return;
    }
    
    // CRITICAL: If we have a pausedTime value, we should resume from that time
    if (pausedTimeRef.current !== null) {
      console.log('[useTimerControls] Resuming from paused time:', pausedTimeRef.current);
      // Set the time remaining to the paused time before starting
      setTimeRemaining(pausedTimeRef.current);
      // Clear pausedTimeRef AFTER setting the time remaining
      const pausedValue = pausedTimeRef.current;
      pausedTimeRef.current = null;
      console.log('[useTimerControls] Cleared pausedTimeRef after using its value:', pausedValue);
    }
    
    // Set running state AFTER handling the paused time
    setIsRunning(true);
    
    // Record session start time if not already set
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
      console.log('[useTimerControls] Setting new session start time:', sessionStartTimeRef.current);
    }
    
    // Save the timer state
    const stateToSave = {
      timerMode,
      isRunning: true,
      timeRemaining: timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current
    };
    console.log('[useTimerControls] Saving timer state after start:', stateToSave);
    saveTimerState(stateToSave);
  }, [timerMode, timeRemaining, currentSessionIndex, saveTimerState, setIsRunning, pausedTimeRef, sessionStartTimeRef, setTimeRemaining, isRunning]);
  
  const handlePause = useCallback(() => {
    console.log('[useTimerControls] PAUSE called with time:', timeRemaining);
    
    // Store the current time when pausing
    pausedTimeRef.current = timeRemaining;
    console.log('[useTimerControls] Storing exact pause time:', timeRemaining);
    
    // Stop the timer
    setIsRunning(false);
    
    // Save the timer state with the paused time
    const stateToSave = {
      timerMode,
      isRunning: false,
      timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      // Add this explicit flag to help with restoring the exact state
      isPaused: true
    };
    console.log('[useTimerControls] Saving timer state after pause:', stateToSave);
    saveTimerState(stateToSave);
    
    // Double check that the pausedTimeRef is still set correctly after state save
    console.log('[useTimerControls] After pause - pausedTimeRef is:', pausedTimeRef.current);
  }, [timerMode, timeRemaining, currentSessionIndex, saveTimerState, setIsRunning, pausedTimeRef, sessionStartTimeRef]);
  
  const handleReset = useCallback(() => {
    console.log('[useTimerControls] RESET called for mode:', timerMode);
    
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
    console.log('[useTimerControls] Reset - cleared pausedTimeRef and sessionStartTimeRef');
    
    // Save the reset state
    const stateToSave = {
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null
    };
    console.log('[useTimerControls] Saving timer state after reset:', stateToSave);
    saveTimerState(stateToSave);
  }, [timerMode, settings, currentSessionIndex, saveTimerState, setIsRunning, setTimeRemaining, sessionStartTimeRef, pausedTimeRef]);
  
  const handleModeChange = useCallback((mode: TimerMode) => {
    console.log('[useTimerControls] MODE CHANGE called from', timerMode, 'to', mode);
    
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
    console.log('[useTimerControls] Mode change - cleared pausedTimeRef');
    
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
    const stateToSave = {
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : currentSessionIndex,
      sessionStartTime: null
    };
    console.log('[useTimerControls] Saving timer state after mode change:', stateToSave);
    saveTimerState(stateToSave);
  }, [timerMode, settings, currentSessionIndex, setTimerMode, setCurrentSessionIndex, saveTimerState, setIsRunning, setTimeRemaining, sessionStartTimeRef, pausedTimeRef]);
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
