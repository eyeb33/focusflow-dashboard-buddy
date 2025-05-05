import { useEffect, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseTimerTickHandlerProps {
  isRunning: boolean;
  timerMode: TimerMode;
  timeRemaining: number;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  handleTimerComplete: () => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  setSessionStartTime: (time: string | null) => void;
  currentSessionIndex: number;
  saveTimerState: (state: any) => void;
  getTotalTimeForMode: () => number;
  pausedTimeRef: React.MutableRefObject<number | null>;
  preventResetOnPauseRef: React.MutableRefObject<boolean>;
}

export function useTimerTickHandler({
  isRunning,
  timerMode,
  timeRemaining,
  setTimeRemaining,
  handleTimerComplete,
  sessionStartTimeRef,
  setSessionStartTime,
  currentSessionIndex,
  saveTimerState,
  getTotalTimeForMode,
  pausedTimeRef,
  preventResetOnPauseRef
}: UseTimerTickHandlerProps) {
  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const lastIsRunningRef = useRef<boolean>(isRunning);
  const currentTimeRef = useRef<number>(timeRemaining);
  
  // Always keep the current time updated
  currentTimeRef.current = timeRemaining;
  
  // First effect: Track running state changes and store time precisely on pause
  useEffect(() => {
    // On transition from running to paused
    if (!isRunning && lastIsRunningRef.current) {
      console.log("PAUSE transition detected in useTimerTickHandler: Storing EXACT pause time:", timeRemaining);
      // Store the exact time when pausing
      pausedTimeRef.current = timeRemaining;
      preventResetOnPauseRef.current = true;
      
      // Save the timer state with the exact time
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: timeRemaining, // Use the current exact time
        currentSessionIndex,
        sessionStartTime: sessionStartTimeRef.current,
      });
    }
    
    // On transition from paused to running
    if (isRunning && !lastIsRunningRef.current) {
      console.log("RESUME transition detected in useTimerTickHandler");
      
      // If we have a stored pause time, use it to resume
      if (pausedTimeRef.current !== null) {
        console.log("Resuming with stored time:", pausedTimeRef.current);
        setTimeRemaining(pausedTimeRef.current);
      }
    }
    
    // Update the running state ref
    lastIsRunningRef.current = isRunning;
  }, [isRunning, timerMode, currentSessionIndex, sessionStartTimeRef, saveTimerState, timeRemaining, pausedTimeRef, preventResetOnPauseRef, setTimeRemaining]);
  
  // Handle timer tick - this effect manages the actual timer interval
  useEffect(() => {
    // Always clear any existing timer first to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Only create a new interval if the timer is running
    if (isRunning) {
      console.log("Starting timer interval with mode:", timerMode, "and time:", timeRemaining);
      
      // Ensure we have a session start time
      if (!sessionStartTimeRef.current) {
        setSessionStartTime(new Date().toISOString());
      }
      
      // Reset lastTickTimeRef when the timer starts to prevent large time jumps
      lastTickTimeRef.current = Date.now();
      
      // Set up the timer interval
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Only update if at least 1 second has passed
        if (elapsedSeconds >= 1) {
          setTimeRemaining(prevTime => {
            // Check if timer completed
            if (prevTime <= elapsedSeconds) {
              // Clear the timer and handle completion
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // Handle timer completion in the next event loop
              setTimeout(() => handleTimerComplete(), 0);
              return 0;
            }
            
            // Calculate new time remaining
            const newTime = prevTime - elapsedSeconds;
            currentTimeRef.current = newTime;
            
            // Save timer state periodically (every 5 seconds)
            if (prevTime % 5 === 0 || newTime % 5 === 0) {
              saveTimerState({
                timerMode,
                isRunning: true,
                timeRemaining: newTime,
                currentSessionIndex,
                sessionStartTime: sessionStartTimeRef.current,
              });
            }
            
            // Reset lastTickTimeRef for next interval
            lastTickTimeRef.current = now;
            
            return newTime;
          });
        }
      }, 200); // Check more frequently for smoother updates
    }

    // Cleanup on component unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isRunning, 
    timerMode,
    handleTimerComplete,
    sessionStartTimeRef, 
    setSessionStartTime, 
    currentSessionIndex, 
    saveTimerState,
    setTimeRemaining
  ]); // Removed timeRemaining from dependencies to prevent resets
  
  return {
    lastTickTimeRef,
  };
}
