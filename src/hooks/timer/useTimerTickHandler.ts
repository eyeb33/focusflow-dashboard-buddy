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
  
  // Keep the stored time remaining in sync with the current time remaining
  // but only when the timer isn't running to avoid circular updates
  useEffect(() => {
    if (!isRunning) {
      storedTimeRemainingRef.current = timeRemaining;
      console.log("Stored paused time:", timeRemaining);
    }
  }, [timeRemaining, isRunning]);
  
  // Handle timer tick
  useEffect(() => {
    // Always clear any existing timer first
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
        const elapsedSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
        
        setTimeRemaining(prevTime => {
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
          
          // Update stored reference
          storedTimeRemainingRef.current = newTime;
          
          return newTime;
        });
        
        lastTickTimeRef.current = now;
      }, 1000);
    } else if (!isRunning) {
      // When paused, immediately save the exact current time
      console.log("Timer paused at exact time:", storedTimeRemainingRef.current);
      
      // Important: Save the exact paused time for resuming correctly
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: storedTimeRemainingRef.current,
        currentSessionIndex,
        sessionStartTime: sessionStartTimeRef.current,
      });
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
  ]);
  
  // Notice we intentionally removed timeRemaining from the dependency array
  // This prevents the effect from re-running when timeRemaining changes
  
  return {
    lastTickTimeRef
  };
}
