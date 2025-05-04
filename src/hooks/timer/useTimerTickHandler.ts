
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
          
          // Save timer state every 5 seconds
          if (prevTime % 5 === 0 || newTime % 5 === 0) {
            saveTimerState({
              timerMode,
              isRunning: true,
              timeRemaining: newTime,
              currentSessionIndex,
              sessionStartTime: sessionStartTimeRef.current,
            });
          }
          
          return newTime;
        });
        
        lastTickTimeRef.current = now;
      }, 1000);
    } else {
      // When paused, make sure we preserve the exact current time
      // Only save state when isRunning changes from true to false
      // This prevents unnecessary state updates
      console.log("Timer paused at exact time:", timeRemaining);
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
    saveTimerState, 
    timeRemaining, 
    sessionStartTimeRef, 
    setSessionStartTime, 
    currentSessionIndex, 
    handleTimerComplete
  ]);
  
  return {
    lastTickTimeRef
  };
}
