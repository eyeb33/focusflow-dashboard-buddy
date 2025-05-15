
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { logTimerStateChange, trackTimerAction } from '@/utils/timerDebugUtils';

interface UseTimerControlStartProps {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (running: boolean) => void;
  setTimeRemaining: (time: number) => void; // Added missing setTimeRemaining prop
  pausedTimeRef: React.MutableRefObject<number | null>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  currentSessionIndex: number;
  saveTimerState: (state: any) => void;
}

export function useTimerControlStart({
  timerMode,
  isRunning,
  timeRemaining,
  setIsRunning,
  setTimeRemaining, // Added to function params
  pausedTimeRef,
  sessionStartTimeRef,
  currentSessionIndex,
  saveTimerState
}: UseTimerControlStartProps) {
  
  return useCallback(() => {
    // Detailed logging to understand current state
    console.log('START called with isRunning:', isRunning, 'and time remaining:', timeRemaining);
    console.log('pausedTimeRef value:', pausedTimeRef.current);
    
    // If timer is already running, do nothing
    if (isRunning) {
      console.log('Timer already running, ignoring start call');
      return;
    }
    
    // Determine which time to use (pausedTime or current timeRemaining)
    // CRITICAL: Always prioritize pausedTimeRef if it exists
    const timeToUse = pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining;
    console.log('Using time for start:', timeToUse, '(pausedTime:', pausedTimeRef.current, ')');
    
    // Log state before change
    logTimerStateChange('start',
      { isRunning, timeRemaining, pausedTime: pausedTimeRef.current },
      { isRunning: true, timeRemaining: timeToUse, pausedTime: null }
    );
    
    // Record session start time if not already set
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
      console.log('Setting session start time:', sessionStartTimeRef.current);
    }
    
    // CRITICAL: Update the displayed time to match the pause time before starting
    if (pausedTimeRef.current !== null && pausedTimeRef.current !== timeRemaining) {
      console.log(`Restoring paused time ${pausedTimeRef.current} before starting`);
      setTimeRemaining(pausedTimeRef.current);
    }
    
    // Start the timer
    setIsRunning(true);
    
    // Save the timer state with the CURRENT time value
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining: timeToUse, // Use the determined time
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      pausedTime: null, // Clear paused time on resume
      timestamp: Date.now()
    });
    
    console.log("Timer started with time:", timeToUse);
    
    // Track action for analytics
    trackTimerAction('start', { 
      mode: timerMode, 
      timeRemaining: timeToUse, 
      sessionIndex: currentSessionIndex 
    });
    
    // Clear pausedTimeRef after we've used it
    pausedTimeRef.current = null;
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, saveTimerState, 
      setIsRunning, setTimeRemaining, pausedTimeRef, sessionStartTimeRef]);
}
