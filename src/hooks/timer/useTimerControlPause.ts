
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { logTimerStateChange } from '@/utils/timerDebugUtils';

interface UseTimerControlPauseProps {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (running: boolean) => void;
  pausedTimeRef: React.MutableRefObject<number | null>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  currentSessionIndex: number;
  saveTimerState: (state: any) => void;
}

export function useTimerControlPause({
  timerMode,
  isRunning,
  timeRemaining,
  setIsRunning,
  pausedTimeRef,
  sessionStartTimeRef,
  currentSessionIndex,
  saveTimerState
}: UseTimerControlPauseProps) {
  
  return useCallback(() => {
    console.log('PAUSE called with time remaining:', timeRemaining);
    
    // If timer is not running, do nothing
    if (!isRunning) {
      console.log('Timer not running, ignoring pause call');
      return;
    }
    
    // Log state before change
    logTimerStateChange('pause',
      { isRunning, timeRemaining, pausedTime: pausedTimeRef.current },
      { isRunning: false, timeRemaining, pausedTime: timeRemaining }
    );
    
    // CRITICAL: Store the current time when pausing
    // This exact time is what we'll resume from
    pausedTimeRef.current = timeRemaining;
    console.log('Storing exact pause time:', timeRemaining);
    
    // Stop the timer
    setIsRunning(false);
    
    // Save the timer state with the paused time
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining, // Save the exact time remaining
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      pausedTime: timeRemaining // Explicitly include pausedTime in saved state
    });
    
    console.log("Timer paused at exact time:", timeRemaining);
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, saveTimerState, 
      setIsRunning, pausedTimeRef, sessionStartTimeRef]);
}
