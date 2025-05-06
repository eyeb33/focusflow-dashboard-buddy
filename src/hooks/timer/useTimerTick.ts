
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useTimerVisibility } from './useTimerVisibility';

interface TimerTickParams {
  isRunning: boolean;
  timerMode: TimerMode;
  timeRemaining: number;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
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
  
  // Handle timer visibility changes (tab switching, etc)
  useTimerVisibility({
    isRunning,
    timeRemaining,
    setTimeRemaining,
    lastTickTimeRef,
    pausedTimeRef,
    handleTimerComplete
  });
  
  // Set up the timer tick effect
  useEffect(() => {
    console.log('[useTimerTick] Effect triggered with:', { 
      isRunning, 
      timeRemaining, 
      pausedTimeRef: pausedTimeRef.current 
    });
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("[useTimerTick] Cleared existing timer interval");
    }
    
    // Only set up the timer if it's running
    if (isRunning) {
      console.log('[useTimerTick] Starting timer interval with time remaining:', timeRemaining);
      
      // Record session start time if not already set
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
      }
      
      // Update last tick time
      lastTickTimeRef.current = Date.now();
      
      // Set up the timer interval
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTickTimeRef.current) / 1000);
        lastTickTimeRef.current = now;
        
        if (elapsed > 0) {
          setTimeRemaining((prevTime) => {
            const newTimeRemaining = Math.max(0, prevTime - elapsed);
            
            // Save state periodically (every 5 seconds)
            if (prevTime % 5 === 0 || newTimeRemaining === 0) {
              const stateToSave = {
                timerMode,
                timeRemaining: newTimeRemaining,
                isRunning,
                currentSessionIndex,
                sessionStartTime: sessionStartTimeRef.current
              };
              
              // Log less frequently to avoid console spam
              if (prevTime % 10 === 0 || newTimeRemaining === 0) {
                console.log('[useTimerTick] Periodic save during tick:', stateToSave);
              }
              
              saveTimerState(stateToSave);
            }
            
            // Handle timer completion
            if (newTimeRemaining === 0) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                console.log('[useTimerTick] Timer completed, cleared interval');
              }
              setTimeout(() => handleTimerComplete(), 0);
            }
            
            return newTimeRemaining;
          });
        }
      }, 1000);
    } else {
      // Timer is stopped, save current timer state
      if (timeRemaining > 0) {
        // Store the exact time when pausing - this is critical
        if (pausedTimeRef.current === null) {
          pausedTimeRef.current = timeRemaining;
          console.log('[useTimerTick] Timer paused at:', timeRemaining, '- setting pausedTimeRef');
        } else {
          console.log('[useTimerTick] Timer already paused at:', pausedTimeRef.current, '- not changing pausedTimeRef');
        }
        
        const stateToSave = {
          timerMode,
          timeRemaining,
          isRunning: false,
          currentSessionIndex,
          sessionStartTime: sessionStartTimeRef.current
        };
        console.log('[useTimerTick] Saving timer state after pause:', stateToSave);
        saveTimerState(stateToSave);
      }
    }
    
    // Cleanup interval on unmount or isRunning changes
    return () => {
      if (timerRef.current) {
        console.log('[useTimerTick] Cleanup: clearing timer interval');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    isRunning, 
    timerMode, 
    handleTimerComplete, 
    timerRef, 
    lastTickTimeRef, 
    sessionStartTimeRef, 
    pausedTimeRef, 
    saveTimerState, 
    currentSessionIndex,
    setTimeRemaining
  ]); // Removed timeRemaining from deps to prevent reset loops
  
  // Return an empty object
  return {};
}
