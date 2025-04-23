
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
    // Store the current time in the ref when starting
    lastRecordedTimeRef.current = timeRemaining;
    const totalTime = getTotalTime(timerMode, settings);
    const elapsedSeconds = totalTime - timeRemaining;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    setIsRunning(true);
    
    // Store the timer state in localStorage when started
    const timerState = {
      isRunning: true,
      timerMode,
      timeRemaining,
      totalTime: getTotalTime(timerMode, settings),
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  };
  
  const handlePause = async (timerMode: TimerMode) => {
    // Important: set isRunning to false first to stop the timer
    setIsRunning(false);
    
    // Store the current timer state in localStorage when paused
    const timerState = {
      isRunning: false,
      timerMode,
      timeRemaining,
      totalTime: getTotalTime(timerMode, settings),
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
    
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
    setIsRunning(false);
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
    const totalTime = getTotalTime(timerMode, settings);
    setTimeRemaining(totalTime);
    lastRecordedTimeRef.current = totalTime;
    lastRecordedFullMinutesRef.current = 0;
    
    // Clear the timer state from localStorage when reset
    localStorage.removeItem('timerState');
    
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
    
    setIsRunning(false);
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    // Update time remaining based on the new mode
    const newTotalTime = getTotalTime(newMode, settings);
    setTimeRemaining(newTotalTime);
    
    // Reset the current session index when manually changing modes
    if (newMode === 'work' && setCurrentSessionIndex) {
      setCurrentSessionIndex(0);
    }
    
    // Clear timer state from localStorage on mode change
    localStorage.removeItem('timerState');
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
