
import { useEffect, useRef } from 'react';

interface UseTimerIntervalProps {
  isRunning: boolean;
  timeRemaining: number;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  lastTickTimeRef: React.MutableRefObject<number>;
  handleTimerComplete: () => void;
  saveTimerState: (state: any) => void;
  timerMode: string;
  currentSessionIndex: number;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
}

export function useTimerInterval({
  isRunning,
  timeRemaining,
  setTimeRemaining,
  timerRef,
  lastTickTimeRef,
  handleTimerComplete,
  saveTimerState,
  timerMode,
  currentSessionIndex,
  sessionStartTimeRef
}: UseTimerIntervalProps) {
  // Track if this is the first render
  const isFirstRender = useRef(true);
  
  // Reference for target end time when timer is running
  const targetEndTimeRef = useRef<number | null>(null);
  
  // Set up the timer interval effect
  useEffect(() => {
    // Skip first render to avoid side effects during initialization
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only set up the timer if it's running
    if (isRunning) {
      console.log("Starting timer interval with time remaining:", timeRemaining);
      
      // Update last tick time to now
      const now = Date.now();
      lastTickTimeRef.current = now;
      
      // Calculate target end time based on current time and remaining seconds
      // This is crucial for accurate timing - we calculate exactly when the timer should end
      targetEndTimeRef.current = now + (timeRemaining * 1000);
      console.log("Target end time set:", new Date(targetEndTimeRef.current).toISOString());
      
      // Record session start time if not already set
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
        console.log('New session start time set:', sessionStartTimeRef.current);
      }
      
      // Set up the timer interval with a high-precision approach
      timerRef.current = setInterval(() => {
        const now = Date.now();
        
        // Calculate remaining time based on target end time, not by decrementing
        // This prevents drift and ensures accuracy
        if (targetEndTimeRef.current !== null) {
          const remainingMs = targetEndTimeRef.current - now;
          const newSecondsRemaining = Math.ceil(remainingMs / 1000);
          
          setTimeRemaining((prevTime) => {
            // If the new calculated time differs from previous, update it
            if (newSecondsRemaining !== prevTime) {
              console.log(`Timer tick: updating from ${prevTime} to ${newSecondsRemaining}`);
              
              // Save state periodically (every 5 seconds)
              if (prevTime % 5 === 0 || newSecondsRemaining <= 0) {
                saveTimerState({
                  timerMode,
                  timeRemaining: Math.max(0, newSecondsRemaining),
                  isRunning: true,
                  currentSessionIndex,
                  sessionStartTime: sessionStartTimeRef.current,
                  pausedTime: null // Make sure pausedTime is null when running
                });
              }
              
              // Handle timer completion
              if (newSecondsRemaining <= 0) {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                  targetEndTimeRef.current = null; // Reset target time
                }
                setTimeout(() => handleTimerComplete(), 0);
                return 0;
              }
              
              return newSecondsRemaining;
            }
            return prevTime;
          });
        }
      }, 100); // Check more frequently (10 times per second) for smoother updates
    } else {
      // Timer not running, reset target end time
      targetEndTimeRef.current = null;
    }
    
    // Cleanup interval on unmount or isRunning changes
    return () => {
      if (timerRef.current) {
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
    saveTimerState, 
    currentSessionIndex
  ]); // timeRemaining is intentionally omitted to prevent reset loops
}
