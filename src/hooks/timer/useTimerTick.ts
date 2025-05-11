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
  const justResumedRef = useRef(false);
  const preservePausedTimeRef = useRef(false);
  const timerStartedRef = useRef(false);
  
  // Debug logging
  console.log(`useTimerTick - Current state: isRunning=${isRunning}, time=${timeRemaining}, pausedTime=${pausedTimeRef.current}`);
  
  // Effect to handle running state changes (start/pause)
  useEffect(() => {
    // When transitioning from paused to running
    if (isRunning && !previousIsRunningRef.current) {
      console.log('State changed from paused to running');
      justResumedRef.current = true;
      
      // We'll use pausedTimeRef in the main timer effect if it exists
      if (pausedTimeRef.current !== null) {
        console.log(`Found pausedTime ${pausedTimeRef.current}, will use it for resuming`);
        
        // Critical: Update the displayed time to match the actual paused time
        setTimeRemaining(pausedTimeRef.current);
      }
    }
    
    // When transitioning from running to paused
    if (!isRunning && previousIsRunningRef.current) {
      console.log('State changed from running to paused');
      pausedTimeRef.current = timeRemaining;
      preservePausedTimeRef.current = true; // Mark that we should preserve this time
      console.log(`Setting pausedTime to ${timeRemaining} and preserving it`);
    }
    
    // Update previous running state for next render
    previousIsRunningRef.current = isRunning;
  }, [isRunning, timeRemaining, pausedTimeRef, setTimeRemaining]);
  
  // Set up the timer tick effect
  useEffect(() => {
    // Debug the current state
    console.log(`Timer tick effect running: isRunning=${isRunning}, time=${timeRemaining}, pausedTime=${pausedTimeRef.current}`);
    
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
      
      // If we've just resumed and have a pausedTime, use it
      if (justResumedRef.current && pausedTimeRef.current !== null) {
        console.log("Resuming with pausedTime:", pausedTimeRef.current);
        setTimeRemaining(pausedTimeRef.current);
        
        // Don't clear pausedTimeRef immediately to prevent issues with settings sync
        // We'll preserve it until we've actually started counting down
        preservePausedTimeRef.current = false;
        justResumedRef.current = false;
      }
      
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
          lastTickTimeRef.current = now;
          
          // Only clear pausedTimeRef after we've actually started counting down
          // This ensures we use the correct time when resuming
          if (pausedTimeRef.current !== null && !preservePausedTimeRef.current) {
            pausedTimeRef.current = null;
            console.log("Cleared pausedTimeRef after timer has started counting down");
          }
          
          setTimeRemaining((prevTime: number) => {
            const newTimeRemaining = Math.max(0, prevTime - elapsedSeconds);
            
            // Save state periodically (every 5 seconds)
            if (prevTime % 5 === 0 || newTimeRemaining === 0) {
              saveTimerState({
                timerMode,
                timeRemaining: newTimeRemaining,
                isRunning: true,
                currentSessionIndex,
                sessionStartTime: sessionStartTimeRef.current,
                pausedTime: null // Make sure pausedTime is null when running
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

  // Reset justResumedRef when needed
  useEffect(() => {
    if (justResumedRef.current && isRunning) {
      justResumedRef.current = false;
    }
  }, [isRunning]);
  
  return;
}
