import { useEffect, useRef } from 'react';
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
  
  // Keep track of previous running state to detect pause events
  const isFirstRender = useRef(true);
  const previousIsRunningRef = useRef(isRunning);
  const pauseRestoredRef = useRef(false);
  
  // Debug logging
  console.log(`useTimerTick - Current state: isRunning=${isRunning}, time=${timeRemaining}, pausedTime=${pausedTimeRef.current}`);
  
  // Set up the timer tick effect
  useEffect(() => {
    // Debug the current state
    console.log(`Timer tick effect running: isRunning=${isRunning}, time=${timeRemaining}, pausedTime=${pausedTimeRef.current}, previousIsRunning=${previousIsRunningRef.current}`);
    
    // Skip first render to avoid side effects during initialization
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousIsRunningRef.current = isRunning;
      return;
    }
    
    // Clear any existing timer
    if (timerRef.current) {
      console.log("Clearing existing timer interval");
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only set up the timer if it's running
    if (isRunning) {
      console.log("Starting timer interval with time remaining:", timeRemaining, "paused time:", pausedTimeRef.current);
      
      // If we have a paused time, restore it when starting the timer
      if (pausedTimeRef.current !== null && !pauseRestoredRef.current) {
        console.log('Restoring from paused time:', pausedTimeRef.current);
        const pausedTime = pausedTimeRef.current;
        setTimeRemaining(pausedTime);
        // Set flag to prevent duplicate restoration
        pauseRestoredRef.current = true;
        // Clear the paused time once we've restored it
        pausedTimeRef.current = null;
        
        // Update last tick time to now to ensure proper timing
        lastTickTimeRef.current = Date.now();
      } else {
        // Reset the restoration flag when we're not restoring from pause
        pauseRestoredRef.current = false;
        
        // Update last tick time
        lastTickTimeRef.current = Date.now();
      }
      
      // Record session start time if not already set
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
        console.log('New session start time set:', sessionStartTimeRef.current);
      }
      
      // Set up the timer interval - use a shorter interval for smoother updates
      console.log("Creating new timer interval");
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastTickTimeRef.current) / 1000);
        
        if (elapsedSeconds > 0) {
          console.log(`Timer tick: elapsed=${elapsedSeconds}s, current time=${timeRemaining}s`);
          lastTickTimeRef.current = now;
          
          setTimeRemaining((prevTime: number) => {
            const newTimeRemaining = Math.max(0, prevTime - elapsedSeconds);
            
            // Save state periodically (every 5 seconds)
            if (prevTime % 5 === 0 || newTimeRemaining === 0) {
              saveTimerState({
                timerMode,
                timeRemaining: newTimeRemaining,
                isRunning: true,
                currentSessionIndex,
                sessionStartTime: sessionStartTimeRef.current
              });
            }
            
            // Handle timer completion
            if (newTimeRemaining === 0) {
              if (timerRef.current) {
                console.log("Timer completed - clearing interval");
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setTimeout(() => handleTimerComplete(), 0);
            }
            
            return newTimeRemaining;
          });
        }
      }, 250); // Check frequently for smoother updates
    }
    
    // Update previous running state for next render
    previousIsRunningRef.current = isRunning;
    
    // Cleanup interval on unmount or isRunning changes
    return () => {
      if (timerRef.current) {
        console.log('Cleaning up timer interval on effect cleanup');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isRunning, 
    timerMode,
    setTimeRemaining, 
    handleTimerComplete, 
    timerRef, 
    lastTickTimeRef, 
    sessionStartTimeRef, 
    pausedTimeRef, 
    saveTimerState, 
    currentSessionIndex
  ]); // Important: timeRemaining is not in dependencies to prevent reset loops
}
