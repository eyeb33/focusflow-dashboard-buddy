
import { useEffect } from 'react';

interface TimerVisibilityParams {
  isRunning: boolean;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  lastTickTimeRef: React.MutableRefObject<number>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  handleTimerComplete: () => void;
}

export function useTimerVisibility({
  isRunning,
  timeRemaining,
  setTimeRemaining,
  lastTickTimeRef,
  pausedTimeRef,
  handleTimerComplete
}: TimerVisibilityParams) {
  // Handle visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // When page becomes hidden
        if (isRunning) {
          // Store the current time
          pausedTimeRef.current = timeRemaining;
          console.log('Page hidden while timer running - storing time:', timeRemaining);
        }
      } else if (document.visibilityState === 'visible') {
        // When page becomes visible again
        if (isRunning) {
          const now = Date.now();
          const lastTick = lastTickTimeRef.current;
          const elapsedSeconds = Math.floor((now - lastTick) / 1000);
          
          if (elapsedSeconds >= 1) {
            console.log(`Page visible after ${elapsedSeconds}s - adjusting timer`);
            
            // Use stored pause time if available
            const timeToUse = pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining;
            pausedTimeRef.current = null;
            
            // Calculate new time
            const newTime = Math.max(0, timeToUse - elapsedSeconds);
            
            // If timer completed while away
            if (newTime <= 0) {
              setTimeRemaining(0);
              setTimeout(() => handleTimerComplete(), 0);
            } else {
              setTimeRemaining(newTime);
            }
            
            // Update last tick time
            lastTickTimeRef.current = now;
          }
        }
      }
    };
    
    // Register visibility change handler
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    isRunning, 
    timeRemaining, 
    handleTimerComplete, 
    setTimeRemaining,
    lastTickTimeRef,
    pausedTimeRef
  ]);
  
  // Return an empty object with timerVisibilityHandlers property
  // This ensures compatibility with code that expects this structure
  return {
    timerVisibilityHandlers: {}
  };
}
