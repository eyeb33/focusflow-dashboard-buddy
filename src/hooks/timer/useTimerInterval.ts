
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
  pausedTimeRef: React.MutableRefObject<number | null>;
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
  sessionStartTimeRef,
  pausedTimeRef
}: UseTimerIntervalProps) {
  // Track if this is the first render
  const isFirstRender = useRef(true);
  
  // Reference for target end time when timer is running
  const targetEndTimeRef = useRef<number | null>(null);
  
  // Store the last timeRemaining value for change detection
  const lastTimeRemainingRef = useRef<number>(timeRemaining);
  
  // Debug when timer state changes
  useEffect(() => {
    console.log(`useTimerInterval effect: isRunning=${isRunning}, timeRemaining=${timeRemaining}, pausedTime=${pausedTimeRef.current}`);
    
    // CRITICAL: Always check if timeRemaining has changed (from sliders or other sources)
    if (Math.abs(lastTimeRemainingRef.current - timeRemaining) > 1 && !isFirstRender.current) {
      console.log(`Detected time change from ${lastTimeRemainingRef.current} to ${timeRemaining}. Updating target time.`);
      
      // If timer is running, update the target end time to reflect new duration
      if (isRunning && timerRef.current) {
        const now = Date.now();
        targetEndTimeRef.current = now + (timeRemaining * 1000);
        console.log(`Updated target end time to ${new Date(targetEndTimeRef.current).toISOString()}`);
      }
    }
    
    // Always update the reference regardless of whether timer is running
    lastTimeRemainingRef.current = timeRemaining;
  }, [isRunning, timeRemaining, pausedTimeRef]);
  
  // Set up the timer interval effect
  useEffect(() => {
    // Skip first render to avoid side effects during initialization
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    console.log(`Timer interval setup: isRunning=${isRunning}, timeRemaining=${timeRemaining}`);
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Cleared existing timer interval");
    }
    
    // Only set up the timer if it's running
    if (isRunning) {
      console.log("Starting timer interval with time remaining:", timeRemaining);
      
      // Update last tick time to now
      const now = Date.now();
      lastTickTimeRef.current = now;
      
      // CRITICAL FIX: Always initialize target end time with current timeRemaining
      // This ensures slider changes are respected
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
        
        // Calculate remaining time based on target end time
        if (targetEndTimeRef.current !== null) {
          const remainingMs = targetEndTimeRef.current - now;
          const newSecondsRemaining = Math.ceil(remainingMs / 1000);
          
          setTimeRemaining((prevTime) => {
            // If the new calculated time differs from previous, update it
            if (newSecondsRemaining !== prevTime) {
              console.log(`Timer tick: updating from ${prevTime} to ${newSecondsRemaining}`);
              
              // Save state periodically
              if (prevTime % 5 === 0 || newSecondsRemaining <= 0) {
                saveTimerState({
                  timerMode,
                  timeRemaining: Math.max(0, newSecondsRemaining),
                  isRunning: true,
                  currentSessionIndex,
                  sessionStartTime: sessionStartTimeRef.current,
                  pausedTime: null
                });
              }
              
              // Handle timer completion
              if (newSecondsRemaining <= 0) {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                  targetEndTimeRef.current = null;
                }
                setTimeout(() => handleTimerComplete(), 0);
                return 0;
              }
              
              return newSecondsRemaining;
            }
            return prevTime;
          });
        }
      }, 100);
    } else {
      // Timer not running, reset target end time
      targetEndTimeRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isRunning, // This dependency is critical - we must re-run when isRunning changes
    timerMode,
    setTimeRemaining, 
    handleTimerComplete, 
    timerRef, 
    lastTickTimeRef, 
    sessionStartTimeRef, 
    saveTimerState, 
    currentSessionIndex,
    pausedTimeRef,
    timeRemaining // Keep timeRemaining in dependencies to respond to slider changes
  ]); 
}
