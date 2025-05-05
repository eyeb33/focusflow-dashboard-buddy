
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerTickParams {
  isRunning: boolean;
  timerMode: TimerMode;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
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
  // Timer tick effect - THE CORE TIMER LOGIC
  useEffect(() => {
    console.log('Timer tick effect running. isRunning=', isRunning, 'timeRemaining=', timeRemaining);
    
    // Clear any existing interval first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('Cleared existing timer interval');
    }
    
    if (isRunning) {
      console.log(`Starting timer with mode: ${timerMode}, time: ${timeRemaining}`);
      
      // Record session start time if not set
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
      }
      
      // Reset paused time when timer starts
      if (pausedTimeRef.current !== null) {
        console.log('Starting from paused time:', pausedTimeRef.current);
        setTimeRemaining(pausedTimeRef.current);
        pausedTimeRef.current = null;
      }
      
      lastTickTimeRef.current = Date.now();
      
      // Start the timer interval
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Only update if at least 1 second has passed
        if (elapsedSeconds >= 1) {
          setTimeRemaining(prevTime => {
            // Check if timer completed
            if (prevTime <= elapsedSeconds) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // Handle timer completion in next event loop
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
                sessionStartTime: sessionStartTimeRef.current
              });
            }
            
            lastTickTimeRef.current = now;
            return newTime;
          });
        }
      }, 200); // Check more frequently for smoother updates
    } else {
      // When timer is stopped/paused, ensure we save the state
      console.log('Timer stopped or paused with time:', timeRemaining);
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining,
        currentSessionIndex,
        sessionStartTime: sessionStartTimeRef.current
      });
    }
    
    // Cleanup interval on unmount or dependency changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        console.log('Cleaning up timer interval on effect cleanup');
      }
    };
  }, [
    isRunning, 
    timerMode, 
    timeRemaining, 
    handleTimerComplete, 
    currentSessionIndex, 
    saveTimerState, 
    setTimeRemaining,
    timerRef,
    lastTickTimeRef,
    sessionStartTimeRef,
    pausedTimeRef
  ]);
}
