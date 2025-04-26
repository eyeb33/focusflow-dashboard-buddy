
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode, getTotalTime, savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';

// Interface for the hook's parameters
interface UseTimerControlsLogicParams {
  timerMode: TimerMode;
  settings: TimerSettings;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (isRunning: boolean) => void;
  setTimeRemaining: (time: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  skipTimerResetRef: React.MutableRefObject<boolean>;
  modeChangeInProgressRef: React.MutableRefObject<boolean>;
  setCurrentSessionIndex?: (index: number) => void;
}

export function useTimerControlsLogic({
  timerMode,
  settings,
  isRunning,
  timeRemaining,
  setIsRunning,
  setTimeRemaining,
  setTimerMode,
  sessionStartTimeRef,
  skipTimerResetRef,
  modeChangeInProgressRef,
  setCurrentSessionIndex
}: UseTimerControlsLogicParams) {
  const { user } = useAuth();
  const lastRecordedTimeRef = useRef<number | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);

  // Timer control functions
  const handleStart = (mode: TimerMode) => {
    // Save the current time to compare on pause
    lastRecordedTimeRef.current = timeRemaining;
    
    const totalTime = getTotalTime(mode, settings);
    const elapsedSeconds = totalTime - timeRemaining;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    
    // Start the timer without changing timeRemaining
    setIsRunning(true);
    console.log("Timer started at:", timeRemaining, "seconds");
  };
  
  const handlePause = async () => {
    // CRITICAL: Only change the running state to false
    console.log("HANDLE PAUSE called with time remaining:", timeRemaining);
    
    // Store current time in localStorage BEFORE changing any state
    const timerState = {
      isRunning: false,
      timerMode,
      timeRemaining: timeRemaining, // Use the current timeRemaining directly
      totalTime: getTotalTime(timerMode, settings),
      timestamp: Date.now(),
      sessionStartTime: localStorage.getItem('sessionStartTime')
    };
    
    console.log("Saving paused timer state with exact time:", timerState);
    localStorage.setItem('timerState', JSON.stringify(timerState));
    
    // Only after saving state, stop the timer
    setIsRunning(false);
    console.log("Timer paused at:", timeRemaining, "seconds - PAUSED state only");
    
    // Save partial session if user is logged in
    if (user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
  };
  
  const handleReset = async () => {
    // Stop the timer
    setIsRunning(false);
    
    // Save partial session if user is logged in
    if (user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    
    // Reset the time
    const newTime = getTotalTime(timerMode, settings);
    setTimeRemaining(newTime);
    lastRecordedTimeRef.current = newTime;
    lastRecordedFullMinutesRef.current = 0;
    console.log("Timer RESET to:", newTime, "seconds");
    
    // Reset the current session index when timer is reset
    if (timerMode === 'work' && setCurrentSessionIndex) {
      setCurrentSessionIndex(0);
    }
  };

  const handleModeChange = async (newMode: TimerMode) => {
    // Save session if the timer was running
    if (isRunning && user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    
    // Stop the timer when changing modes
    setIsRunning(false);
    
    // Reset tracking
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    // Set new time according to the new mode
    const newTime = getTotalTime(newMode, settings);
    setTimeRemaining(newTime);
    console.log(`Timer mode changed to ${newMode} with time:`, newTime, "seconds");
    
    // Reset the current session index when manually changing modes
    if (newMode === 'work' && setCurrentSessionIndex) {
      setCurrentSessionIndex(0);
    }
    
    // Finally, change the timer mode
    setTimerMode(newMode);
  };

  const resetTimerState = () => {
    // Calculate the correct time for the current mode
    const currentMode = localStorage.getItem('timerMode') || 'work';
    const newTime = getTotalTime(currentMode as TimerMode, settings);
    setTimeRemaining(newTime);
    
    // Reset recording refs
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    console.log("Timer state reset to:", newTime, "seconds for mode:", currentMode);
  };

  return {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    lastRecordedFullMinutesRef,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    resetTimerState
  };
}
