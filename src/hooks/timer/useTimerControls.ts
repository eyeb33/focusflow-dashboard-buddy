
import { useCallback, useRef } from "react";
import { TimerMode } from "@/utils/timerContextUtils";
import { TimerSettings } from "../useTimerSettings";

interface UseTimerControlsProps {
  timerMode: TimerMode;
  settings: TimerSettings;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (isRunning: boolean) => void;
  setTimeRemaining: (timeRemaining: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  setSessionStartTime: (time: string | null) => void;
  setCurrentSessionIndex: React.Dispatch<React.SetStateAction<number>>;
  currentSessionIndex: number;
  getTotalTimeForMode: () => number;
  saveTimerState: (state: any) => void;
  pausedTimeRef: React.MutableRefObject<number | null>;
}

export function useTimerControls({
  timerMode,
  settings,
  isRunning,
  timeRemaining,
  setIsRunning,
  setTimeRemaining,
  setTimerMode,
  sessionStartTimeRef,
  setSessionStartTime,
  setCurrentSessionIndex,
  currentSessionIndex,
  getTotalTimeForMode,
  saveTimerState,
  pausedTimeRef
}: UseTimerControlsProps) {
  // Use refs to preserve values between renders
  const preventResetOnPauseRef = useRef<boolean>(false);
  const exactPauseTimeRef = useRef<number | null>(null);
  const pauseInProgressRef = useRef<boolean>(false);
  
  // Start the timer
  const handleStart = useCallback(() => {
    console.log("handleStart called with mode:", timerMode, "and time:", timeRemaining);
    
    // If timer is already at 0, reset it first
    if (timeRemaining <= 0) {
      const newTime = getTotalTimeForMode();
      setTimeRemaining(newTime);
    }
    
    // If we have a stored pause time, use that instead of current time
    if (pausedTimeRef.current !== null) {
      console.log("Resuming from stored pause time:", pausedTimeRef.current);
      setTimeRemaining(pausedTimeRef.current);
      exactPauseTimeRef.current = pausedTimeRef.current;
    }

    // Set session start time if not already set
    if (!sessionStartTimeRef.current) {
      setSessionStartTime(new Date().toISOString());
    }
    
    // Prevent reset on pause
    preventResetOnPauseRef.current = true;
    pauseInProgressRef.current = false;
    
    // Start the timer
    setIsRunning(true);
    
    // Save timer state
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining: pausedTimeRef.current || timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
    });
    
    // Clear the pause time after using it
    pausedTimeRef.current = null;
  }, [timerMode, timeRemaining, setIsRunning, setTimeRemaining, sessionStartTimeRef, setSessionStartTime, saveTimerState, getTotalTimeForMode, currentSessionIndex, pausedTimeRef]);
  
  // Pause the timer
  const handlePause = useCallback(() => {
    console.log("handlePause called with mode:", timerMode, "and time:", timeRemaining);
    
    // Prevent multiple pause actions
    if (pauseInProgressRef.current) {
      console.log("Pause already in progress, skipping");
      return;
    }
    
    // Mark that we're pausing
    pauseInProgressRef.current = true;
    
    // Store the exact time before pausing
    exactPauseTimeRef.current = timeRemaining;
    pausedTimeRef.current = timeRemaining;
    console.log("Stored exact pause time:", exactPauseTimeRef.current);
    
    // Set preventResetOnPauseRef to true to prevent reset
    preventResetOnPauseRef.current = true;
    
    // Stop the timer
    setIsRunning(false);
    
    // Save timer state with current time
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
    });
    
    console.log("Timer paused at:", timeRemaining, "seconds");
  }, [timerMode, setIsRunning, sessionStartTimeRef, saveTimerState, timeRemaining, currentSessionIndex, pausedTimeRef]);
  
  // Reset the timer
  const handleReset = useCallback(() => {
    console.log("handleReset called with mode:", timerMode);
    
    // Stop the timer
    setIsRunning(false);
    pauseInProgressRef.current = false;
    
    // Reset the time based on current mode
    const newTime = getTotalTimeForMode();
    console.log("Resetting timer to:", newTime, "seconds");
    
    setTimeRemaining(newTime);
    exactPauseTimeRef.current = null;
    pausedTimeRef.current = null;
    
    // Clear session start time
    setSessionStartTime(null);
    
    // Save state with reset time
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null,
    });
  }, [timerMode, getTotalTimeForMode, setIsRunning, setTimeRemaining, setSessionStartTime, saveTimerState, currentSessionIndex, pausedTimeRef]);
  
  // Change timer mode
  const handleModeChange = useCallback((mode: TimerMode) => {
    console.log("handleModeChange called from", timerMode, "to", mode);
    
    // Stop the timer first
    setIsRunning(false);
    pauseInProgressRef.current = false;
    
    // Reset session index when switching to work mode from a break
    if (mode === 'work' && (timerMode === 'break' || timerMode === 'longBreak')) {
      setCurrentSessionIndex(0);
    }
    
    // Set the new mode
    setTimerMode(mode);
    
    // Calculate new time for the mode
    const totalTime = (() => {
      switch (mode) {
        case 'work': return settings.workDuration * 60;
        case 'break': return settings.breakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
        default: return settings.workDuration * 60;
      }
    })();
    
    console.log("Mode changed to", mode, "with time:", totalTime);
    setTimeRemaining(totalTime);
    exactPauseTimeRef.current = null;
    pausedTimeRef.current = null;
    
    // Clear session start time
    setSessionStartTime(null);
    
    // Save state with new mode and reset time
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: totalTime,
      currentSessionIndex: mode === 'work' ? 0 : currentSessionIndex,
      sessionStartTime: null,
    });
  }, [timerMode, settings, setIsRunning, setTimerMode, setTimeRemaining, setSessionStartTime, setCurrentSessionIndex, saveTimerState, currentSessionIndex, pausedTimeRef]);
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    preventResetOnPauseRef,
    exactPauseTimeRef,
    pauseInProgressRef
  };
}
