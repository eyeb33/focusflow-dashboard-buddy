
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';

interface UseTimerControlsProps {
  timerMode: TimerMode;
  settings: TimerSettings;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  setTimerMode: React.Dispatch<React.SetStateAction<TimerMode>>;
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
  saveTimerState
}: UseTimerControlsProps) {
  // Timer control functions
  const handleStart = useCallback(() => {
    console.log("Starting timer...");
    if (!sessionStartTimeRef.current) {
      setSessionStartTime(new Date().toISOString());
    }
    setIsRunning(true);
  }, [sessionStartTimeRef, setSessionStartTime, setIsRunning]);
  
  const handlePause = useCallback(() => {
    console.log("Pausing timer...");
    setIsRunning(false);
    
    // Save state immediately on pause
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining,
      currentSessionIndex: 0,
      sessionStartTime: sessionStartTimeRef.current
    });
  }, [timerMode, timeRemaining, sessionStartTimeRef, saveTimerState, setIsRunning]);
  
  const handleReset = useCallback(() => {
    // Stop the timer
    setIsRunning(false);
    
    // Reset the time
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Reset session start time
    setSessionStartTime(null);
    
    console.log("Timer reset to", newTime, "seconds");
    
    // Save the reset state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: 0,
      sessionStartTime: null
    });
  }, [timerMode, getTotalTimeForMode, setIsRunning, setTimeRemaining, setSessionStartTime, saveTimerState]);
  
  const handleModeChange = useCallback((mode: TimerMode) => {
    // Stop the timer when changing modes
    setIsRunning(false);
    
    // Reset session tracking
    setSessionStartTime(null);
    
    // Change the mode
    setTimerMode(mode);
    
    // Set the appropriate time for the new mode
    let newTime: number;
    
    switch (mode) {
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
    
    setTimeRemaining(newTime);
    
    // If switching to work mode manually, reset the cycle
    if (mode === 'work') {
      setCurrentSessionIndex(0);
    }
    
    // Save the new mode state
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : 0,
      sessionStartTime: null
    });
  }, [settings, setIsRunning, setSessionStartTime, setTimerMode, setTimeRemaining, setCurrentSessionIndex, saveTimerState]);
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
