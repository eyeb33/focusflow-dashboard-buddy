
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
  getTotalTimeForMode
}: UseTimerTickHandlerProps) {
  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const storedTimeRemainingRef = useRef<number>(timeRemaining);
  const lastIsRunningRef = useRef<boolean>(isRunning);
  const timeAtPauseRef = useRef<number>(timeRemaining);
  const pauseInitiatedRef = useRef<boolean>(false);
  const resumeInitiatedRef = useRef<boolean>(false);
  
  // First effect: Track running state changes and store time precisely on pause
  useEffect(() => {
    // On transition from running to paused
    if (!isRunning && lastIsRunningRef.current) {
      console.log("PAUSE transition detected in useTimerTickHandler: Storing EXACT pause time:", timeRemaining);
      // Store the exact time when pausing
      timeAtPauseRef.current = timeRemaining;
      storedTimeRemainingRef.current = timeRemaining;
      pauseInitiatedRef.current = true;
      
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
      console.log("RESUME transition detected in useTimerTickHandler: Using stored time:", timeAtPauseRef.current);
      resumeInitiatedRef.current = true;
    }
    
    // Update the running state ref
    lastIsRunningRef.current = isRunning;
  }, [isRunning, timerMode, currentSessionIndex, sessionStartTimeRef, saveTimerState, timeRemaining]);
  
  // Second effect: Apply stored time when resuming (always runs, but only takes action when needed)
  useEffect(() => {
    if (resumeInitiatedRef.current) {
      console.log("Applying saved time on resume:", timeAtPauseRef.current);
      
      // Only update if there's a significant difference
      if (Math.abs(timeRemaining - timeAtPauseRef.current) > 1) {
        setTimeRemaining(timeAtPauseRef.current);
      }
      
      // Reset the flags
      resumeInitiatedRef.current = false;
      pauseInitiatedRef.current = false;
    }
  }, [isRunning, setTimeRemaining, timeRemaining]);
  
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
            
            // Save timer state periodically
            if (prevTime % 5 === 0 || newTime % 5 === 0) {
              saveTimerState({
                timerMode,
                isRunning: true,
                timeRemaining: newTime,
                currentSessionIndex,
                sessionStartTime: sessionStartTimeRef.current,
              });
            }
            
            // Update refs with current values
            storedTimeRemainingRef.current = newTime;
            timeAtPauseRef.current = newTime;
            
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
    storedTimeRemainingRef,
    timeAtPauseRef,
    pauseInitiatedRef,
    resumeInitiatedRef
  };
}
