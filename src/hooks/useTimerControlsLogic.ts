
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode, getTotalTime, savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';

export function useTimerControlsLogic(settings: TimerSettings) {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const lastRecordedTimeRef = useRef<number | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);

  // Timer control functions
  const handleStart = (timerMode: TimerMode) => {
    lastRecordedTimeRef.current = timeRemaining;
    const totalTime = getTotalTime(timerMode, settings);
    const elapsedSeconds = totalTime - timeRemaining;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    setIsRunning(true);
  };
  
  const handlePause = async (timerMode: TimerMode) => {
    // Only change the running state, don't reset the time
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
  };
  
  const handleReset = async (timerMode: TimerMode, setCurrentSessionIndex?: (index: number) => void) => {
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
    setTimeRemaining(getTotalTime(timerMode, settings));
    lastRecordedTimeRef.current = getTotalTime(timerMode, settings);
    lastRecordedFullMinutesRef.current = 0;
    
    // Reset the current session index when timer is reset
    if (timerMode === 'work' && setCurrentSessionIndex) {
      setCurrentSessionIndex(0);
    }
  };

  const handleModeChange = async (
    currentMode: TimerMode,
    newMode: TimerMode, 
    setCurrentSessionIndex?: (index: number) => void
  ) => {
    // Save session if the timer was running
    if (isRunning && user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(currentMode, settings);
      await savePartialSession(
        user.id, 
        currentMode, 
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
    setTimeRemaining(getTotalTime(newMode, settings));
    
    // Reset the current session index when manually changing modes
    if (newMode === 'work' && setCurrentSessionIndex) {
      setCurrentSessionIndex(0);
    }
  };

  const resetTimerState = () => {
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
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
