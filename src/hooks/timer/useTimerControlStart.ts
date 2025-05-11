
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { logTimerStateChange } from '@/utils/timerDebugUtils';

interface UseTimerControlStartProps {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (running: boolean) => void;
  setTimeRemaining: (time: number) => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  currentSessionIndex: number;
  saveTimerState: (state: any) => void;
}

export function useTimerControlStart({
  timerMode,
  isRunning,
  timeRemaining,
  setIsRunning,
  setTimeRemaining,
  sessionStartTimeRef,
  pausedTimeRef,
  currentSessionIndex,
  saveTimerState
}: UseTimerControlStartProps) {
  
  return useCallback(() => {
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
    
    // Use paused time if available, otherwise use current time
    let timeToUse = pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining;
    console.log(`Using time for resume: ${timeToUse}`);
    
    // Make sure the displayed time matches the actual time we're using
    // This ensures the UI shows the correct paused time
    if (timeToUse !== timeRemaining) {
      console.log(`Updating displayed time to match actual time: ${timeToUse}`);
      setTimeRemaining(timeToUse);
    }
    
    // Ensure we have a session start time
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    
    // Save the timer state with the current time
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining: timeToUse,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      pausedTime: null // No need for pausedTime when running
    });
    
    // Set running state AFTER updating time and state
    setIsRunning(true);
    
    console.log("Timer started with mode:", timerMode, "and time:", timeToUse);
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, pausedTimeRef, 
      sessionStartTimeRef, setIsRunning, setTimeRemaining, saveTimerState]);
}
