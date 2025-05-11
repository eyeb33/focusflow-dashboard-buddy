
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { logTimerStateChange, trackTimerAction } from '@/utils/timerDebugUtils';

interface UseTimerControlStartProps {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (running: boolean) => void;
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
  pausedTimeRef,
  sessionStartTimeRef,
  currentSessionIndex,
  saveTimerState
}: UseTimerControlStartProps) {
  
  return useCallback(() => {
    console.log('START called with isRunning:', isRunning, 'and time remaining:', timeRemaining);
    
    // If timer is already running, do nothing
    if (isRunning) {
      console.log('Timer already running, ignoring start call');
      return;
    }
    
    // If timer is paused, use the exact paused time
    const startTime = pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining;
    
    console.log('Starting timer with time:', startTime);
    
    // Log state before change
    logTimerStateChange('start',
      { isRunning, timeRemaining, pausedTime: pausedTimeRef.current },
      { isRunning: true, timeRemaining: startTime, pausedTime: null }
    );
    
    // Record session start time if not already set
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
      console.log('Setting session start time:', sessionStartTimeRef.current);
    }
    
    // Start the timer
    setIsRunning(true);
    
    // Save the timer state without paused time
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining: startTime,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      pausedTime: null // Clear paused time on resume
    });
    
    // Clear paused time reference
    pausedTimeRef.current = null;
    console.log('Timer started, cleared pausedTimeRef');
    
    // Track action for analytics
    trackTimerAction('start', { 
      mode: timerMode, 
      timeRemaining: startTime, 
      sessionIndex: currentSessionIndex 
    });
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, saveTimerState, 
      setIsRunning, pausedTimeRef, sessionStartTimeRef]);
}
