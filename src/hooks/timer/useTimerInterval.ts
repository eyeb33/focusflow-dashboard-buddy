
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
  
  // Debug logging
  console.log(`useTimerInterval - Current state: isRunning=${isRunning}, time=${timeRemaining}`);
  
  // Set up the timer interval effect
  useEffect(() => {
    // Skip first render to avoid side effects during initialization
    if (isFirstRender.current) {
      isFirstRender.current = false;
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
    saveTimerState, 
    currentSessionIndex
  ]); // timeRemaining is intentionally omitted to prevent reset loops
}
