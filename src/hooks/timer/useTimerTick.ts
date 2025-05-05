
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useTimerVisibility } from './useTimerVisibility';

interface TimerTickParams {
  isRunning: boolean;
  timerMode: TimerMode;
  timeRemaining: number;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  lastTickTimeRef: React.MutableRefObject<number>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  handleTimerComplete: () => void;
  saveTimerState: (state: any) => void;
  currentSessionIndex: number;
}

export function useTimerTick({
  isRunning,
  timerMode,
  timeRemaining,
  setTimeRemaining,
  timerRef,
  lastTickTimeRef,
  sessionStartTimeRef,
  pausedTimeRef,
  handleTimerComplete,
  saveTimerState,
  currentSessionIndex
}: TimerTickParams) {
  
  // Handle timer visibility changes (tab switching, etc)
  useTimerVisibility({
    isRunning,
    timeRemaining,
    setTimeRemaining,
    lastTickTimeRef,
    pausedTimeRef,
    handleTimerComplete
  });
  
  // Set up the timer tick effect
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only set up the timer if it's running
    if (isRunning) {
      console.log('Starting timer interval with time remaining:', timeRemaining);
      
      // Record session start time if not already set
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
      }
      
      // If we have a paused time, use it to resume from exactly where we left off
      if (pausedTimeRef.current !== null) {
        console.log('Tick effect: Using paused time value for resume:', pausedTimeRef.current);
        setTimeRemaining(pausedTimeRef.current);
        // Now clear the pausedTimeRef since we've restored the state
        pausedTimeRef.current = null;
      }
      
      // Update last tick time
      lastTickTimeRef.current = Date.now();
      
      // Set up the timer interval
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTickTimeRef.current) / 1000);
        lastTickTimeRef.current = now;
        
        if (elapsed > 0) {
          setTimeRemaining((prevTime) => {
            const newTimeRemaining = Math.max(0, prevTime - elapsed);
            
            // Save state periodically (every 5 seconds)
            if (prevTime % 5 === 0 || newTimeRemaining === 0) {
              saveTimerState({
                timerMode,
                timeRemaining: newTimeRemaining,
                isRunning,
                currentSessionIndex,
                sessionStartTime: sessionStartTimeRef.current
              });
            }
            
            // Handle timer completion
            if (newTimeRemaining === 0) {
              handleTimerComplete();
              
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
            
            return newTimeRemaining;
          });
        }
      }, 1000);
    } else {
      // Timer is stopped, save current timer state
      if (timeRemaining > 0) {
        // Store the exact time when pausing
        pausedTimeRef.current = timeRemaining;
        console.log('Timer paused at:', timeRemaining);
        
        saveTimerState({
          timerMode,
          timeRemaining,
          isRunning: false,
          currentSessionIndex,
          sessionStartTime: sessionStartTimeRef.current
        });
      }
    }
    
    // Cleanup interval on unmount or isRunning changes
    return () => {
      if (timerRef.current) {
        console.log('Clearing timer interval');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isRunning, 
    timerMode, 
    timeRemaining,
    setTimeRemaining, 
    handleTimerComplete, 
    timerRef, 
    lastTickTimeRef, 
    sessionStartTimeRef, 
    pausedTimeRef, 
    saveTimerState, 
    currentSessionIndex
  ]);
  
  // Return an empty object
  return {};
}
