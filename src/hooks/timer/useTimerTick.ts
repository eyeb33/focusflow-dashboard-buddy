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
  
  // Keep track of previous running state
  const isFirstRender = useRef(true);
  const previousIsRunningRef = useRef(isRunning);
  const resumedFromPauseRef = useRef(false);
  const lastTimeRemainingRef = useRef(timeRemaining);
  
  // Debug logging
  console.log(`useTimerTick - Current state: isRunning=${isRunning}, time=${timeRemaining}, pausedTime=${pausedTimeRef.current}`);
  
  // Always keep track of the latest time remaining value
  useEffect(() => {
    lastTimeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);
  
  // Effect to handle pausing and resuming
  useEffect(() => {
    // When going from paused to running, check if we need to restore from pausedTimeRef
    if (isRunning && !previousIsRunningRef.current && pausedTimeRef.current !== null) {
      console.log('Resuming from paused state with time:', pausedTimeRef.current);
      setTimeRemaining(pausedTimeRef.current);
      resumedFromPauseRef.current = true;
      pausedTimeRef.current = null;
    }
    
    // When pausing, ensure we capture the exact current time
    if (!isRunning && previousIsRunningRef.current) {
      console.log('Just paused - storing current exact time:', lastTimeRemainingRef.current);
      pausedTimeRef.current = lastTimeRemainingRef.current;
    }
    
    previousIsRunningRef.current = isRunning;
    
    // This cleanup function runs when isRunning changes
    return () => {
      console.log('isRunning changed, cleanup function executed');
    };
  }, [isRunning, pausedTimeRef, setTimeRemaining, lastTimeRemainingRef]);
  
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
      console.log("Starting timer interval with time remaining:", timeRemaining);
      
      // Update last tick time
      lastTickTimeRef.current = Date.now();
      
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
            
            // Update last known time
            lastTimeRemainingRef.current = newTimeRemaining;
            
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
    else if (previousIsRunningRef.current && !isRunning) {
      // This is a pause event (was running, now stopped)
      console.log("Pause detected - preserving current time:", timeRemaining);
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

  // Reset resumedFromPauseRef when needed
  useEffect(() => {
    if (resumedFromPauseRef.current) {
      resumedFromPauseRef.current = false;
    }
  }, [timeRemaining]);
}
