
import { useCallback } from "react";
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
      timeRemaining,  // Use the current timeRemaining to resume from where we paused
      currentSessionIndex: 0, // This will be updated in the timer core
      sessionStartTime: sessionStartTimeRef.current,
    });
  }, [timerMode, timeRemaining, setIsRunning, setTimeRemaining, sessionStartTimeRef, setSessionStartTime, saveTimerState, getTotalTimeForMode]);
  
  // Pause the timer
  const handlePause = useCallback(() => {
    console.log("Pausing timer with mode:", timerMode, "and time:", timeRemaining);
    
    setIsRunning(false);
    
    // Critical: Save the exact current time remaining when pausing
    // Don't reset the time or do any additional state changes
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: timeRemaining, // Preserve the exact time remaining
      currentSessionIndex: 0, // This will be updated in the timer core
      sessionStartTime: sessionStartTimeRef.current, // Keep the session start time reference
    });
  }, [timerMode, timeRemaining, setIsRunning, sessionStartTimeRef, saveTimerState]);
  
  // Reset the timer
  const handleReset = useCallback(() => {
    console.log("Resetting timer with mode:", timerMode);
    
    // Stop the timer
    setIsRunning(false);
    
    // Reset the time based on current settings and mode
    let newTime;
    switch (timerMode) {
      case 'work':
        newTime = settings.workDuration * 60;
        break;
      case 'break':
        newTime = settings.breakDuration * 60;
        break;
      case 'longBreak':
        newTime = settings.longBreakDuration * 60;
        break;
      default:
        newTime = settings.workDuration * 60;
    }
    
    console.log(`Resetting timer for mode ${timerMode} to ${newTime} seconds (${Math.floor(newTime / 60)}:${(newTime % 60).toString().padStart(2, '0')})`);
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
  }, [timerMode, settings, setIsRunning, setTimeRemaining, setSessionStartTime, saveTimerState]);
  
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
    let totalTime;
    switch (mode) {
      case 'work':
        totalTime = settings.workDuration * 60;
        break;
      case 'break':
        totalTime = settings.breakDuration * 60;
        break;
      case 'longBreak':
        totalTime = settings.longBreakDuration * 60;
        break;
      default:
        totalTime = settings.workDuration * 60;
    }
    
    console.log(`Mode changed to ${mode}, setting time to ${totalTime} seconds (${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')})`);
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
  }, [timerMode, settings, setIsRunning, setTimerMode, setTimeRemaining, setSessionStartTime, setCurrentSessionIndex, saveTimerState]);
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
  };
}
