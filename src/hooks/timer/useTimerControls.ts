
import { useCallback } from "react";
import { TimerMode, getTotalTime } from "@/utils/timerContextUtils";
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
  getTotalTimeForMode: () => number;
  saveTimerState: (state: any) => void;
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
  getTotalTimeForMode,
  saveTimerState,
}: UseTimerControlsProps) {
  // Start the timer
  const handleStart = useCallback(() => {
    console.log("Starting timer with mode:", timerMode, "and time:", timeRemaining);
    
    // If timer is already at 0, reset it first
    if (timeRemaining <= 0) {
      const newTime = getTotalTimeForMode();
      setTimeRemaining(newTime);
    }

    // Set session start time if not already set
    if (!sessionStartTimeRef.current) {
      setSessionStartTime(new Date().toISOString());
    }
    
    setIsRunning(true);
    
    // Save state with running=true
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining,
      currentSessionIndex: 0, // This will be updated in the timer core
      sessionStartTime: sessionStartTimeRef.current,
    });
  }, [timerMode, timeRemaining, setIsRunning, setTimeRemaining, sessionStartTimeRef, setSessionStartTime, saveTimerState, getTotalTimeForMode]);
  
  // Pause the timer
  const handlePause = useCallback(() => {
    console.log("Pausing timer with mode:", timerMode, "and time:", timeRemaining);
    
    setIsRunning(false);
    
    // Save state with running=false
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining,
      currentSessionIndex: 0, // This will be updated in the timer core
      sessionStartTime: sessionStartTimeRef.current,
    });
  }, [timerMode, timeRemaining, setIsRunning, sessionStartTimeRef, saveTimerState]);
  
  // Reset the timer
  const handleReset = useCallback(() => {
    console.log("Resetting timer with mode:", timerMode);
    
    // Stop the timer
    setIsRunning(false);
    
    // Reset the time
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Clear session start time
    setSessionStartTime(null);
    
    // Save state with running=false and reset time
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: 0,
      sessionStartTime: null,
    });
  }, [timerMode, setIsRunning, setTimeRemaining, setSessionStartTime, saveTimerState, getTotalTimeForMode]);
  
  // Change timer mode
  const handleModeChange = useCallback((mode: TimerMode) => {
    console.log("Changing timer mode from", timerMode, "to", mode);
    
    // Stop the timer first
    setIsRunning(false);
    
    // Reset session index when switching to work mode from a break
    if (mode === 'work' && (timerMode === 'break' || timerMode === 'longBreak')) {
      setCurrentSessionIndex(0);
    }
    
    // Set the new mode
    setTimerMode(mode);
    
    // Reset time based on new mode
    const totalTime = getTotalTime(mode, settings);
    setTimeRemaining(totalTime);
    
    // Clear session start time
    setSessionStartTime(null);
    
    // Save state with new mode and reset time
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: totalTime,
      currentSessionIndex: mode === 'work' ? 0 : 0,
      sessionStartTime: null,
    });
  }, [timerMode, setIsRunning, setTimerMode, setTimeRemaining, setSessionStartTime, setCurrentSessionIndex, settings, saveTimerState]);
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
  };
}
