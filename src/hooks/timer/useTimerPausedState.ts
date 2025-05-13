import { useEffect, useRef } from 'react';

interface UseTimerPausedStateProps {
  isRunning: boolean;
  timeRemaining: number;
  pausedTimeRef: React.MutableRefObject<number | null>;
  setTimeRemaining: (time: number) => void;
}

export function useTimerPausedState({
  isRunning,
  timeRemaining,
  pausedTimeRef,
  setTimeRemaining
}: UseTimerPausedStateProps) {
  // Keep track of previous running state
  const previousIsRunningRef = useRef(isRunning);
  const justResumedRef = useRef(false);
  const preservePausedTimeRef = useRef(false);
  
  // Debug logging
  console.log(`useTimerPausedState - Current state: isRunning=${isRunning}, time=${timeRemaining}, pausedTime=${pausedTimeRef.current}`);
  
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
      // Since useTimerControlPause.ts already sets pausedTimeRef,
      // we just need to ensure the UI reflects this paused time
      if (pausedTimeRef.current !== null) {
        console.log(`Ensuring UI shows paused time: ${pausedTimeRef.current}`);
        setTimeRemaining(pausedTimeRef.current);
      }
      preservePausedTimeRef.current = true; // Mark that we should preserve this time
      console.log(`Preserving pausedTime: ${pausedTimeRef.current}`);
    }
    
    // Update previous running state for next render
    previousIsRunningRef.current = isRunning;
  }, [isRunning, timeRemaining, pausedTimeRef, setTimeRemaining]);
  
  // Reset justResumedRef when needed
  useEffect(() => {
    if (justResumedRef.current && isRunning) {
      justResumedRef.current = false;
    }
  }, [isRunning]);
  
  return {
    justResumedRef,
    preservePausedTimeRef
  };
}
