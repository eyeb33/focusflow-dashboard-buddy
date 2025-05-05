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
  
  // Keep the stored time remaining in sync with the current time remaining
  useEffect(() => {
    storedTimeRemainingRef.current = timeRemaining;
    
    // When transitioning from running to paused
    if (!isRunning && lastIsRunningRef.current !== isRunning) {
      console.log("PAUSE detected: Storing exact pause time:", timeRemaining);
      // Store the exact time when pausing
      timeAtPauseRef.current = timeRemaining;
      // Save the current time on pause to ensure we resume from exact time
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: timeRemaining,
        currentSessionIndex,
        sessionStartTime: sessionStartTimeRef.current,
      });
    }
    
    // Update the running state ref
    lastIsRunningRef.current = isRunning;
  }, [timeRemaining, isRunning, timerMode, currentSessionIndex, sessionStartTimeRef, saveTimerState]);
  
  // Handle timer tick
  useEffect(() => {
    // Always clear any existing timer first to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      console.log("Starting timer with mode:", timerMode, "and time:", timeRemaining);
      
      // Ensure we have a session start time
      if (!sessionStartTimeRef.current) {
        setSessionStartTime(new Date().toISOString());
      }
      
      // Important: Update lastTickTimeRef when the timer starts/resumes
      // This prevents large time jumps when resuming
      lastTickTimeRef.current = Date.now();
      
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
              
              // We use setTimeout to ensure state updates occur in the next event loop
              setTimeout(() => handleTimerComplete(), 0);
              return 0;
            }
            
            // Calculate new time remaining
            const newTime = prevTime - elapsedSeconds;
            
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
            
            // Always update stored reference
            storedTimeRemainingRef.current = newTime;
            timeAtPauseRef.current = newTime;
            
            // Reset lastTickTimeRef for next interval
            lastTickTimeRef.current = now;
            
            return newTime;
          });
        }
      }, 200); // Check more frequently for smoother updates
    }

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
  ]); // Removed timeRemaining from dependency array to prevent reset loops
  
  // Add another effect to handle transitions between running states
  useEffect(() => {
    // When transitioning from paused to running, ensure we use the stored time
    if (isRunning && !lastIsRunningRef.current) {
      console.log("RESUME detected: Using stored pause time:", timeAtPauseRef.current);
      
      // When resuming, make sure we use the exact time that was stored when pausing
      if (timeAtPauseRef.current !== timeRemaining) {
        console.log("Adjusting time remaining from", timeRemaining, "to stored value:", timeAtPauseRef.current);
        setTimeRemaining(timeAtPauseRef.current);
      }
    }
  }, [isRunning, setTimeRemaining, timeRemaining]);
  
  return {
    lastTickTimeRef,
    storedTimeRemainingRef,
    timeAtPauseRef
  };
}
