
import { useEffect } from 'react';

interface UseTimerVisibilityProps {
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  timeRemaining: number;
  setTimeRemaining: (timeRemaining: number) => void;
  handleTimerComplete: () => void;
  lastTickTimeRef: React.MutableRefObject<number>;
  pausedTimeRef?: React.MutableRefObject<number | null>;
}

export function useTimerVisibility({
  isRunning,
  setIsRunning,
  timeRemaining,
  setTimeRemaining,
  handleTimerComplete,
  lastTickTimeRef,
  pausedTimeRef
}: UseTimerVisibilityProps) {
  // Handle visibility change
  useEffect(() => {
    // Function to handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // When page becomes hidden, store the time we left
        if (isRunning) {
          console.log('Page hidden while timer running - storing time:', timeRemaining);
          if (pausedTimeRef) {
            pausedTimeRef.current = timeRemaining;
          }
        }
      } else if (document.visibilityState === 'visible') {
        // When page becomes visible
        if (isRunning) {
          const now = Date.now();
          const lastTick = lastTickTimeRef.current;
          const elapsedSeconds = Math.floor((now - lastTick) / 1000);
          
          if (elapsedSeconds >= 1) {
            console.log(`Page visible after ${elapsedSeconds}s - adjusting timer`);
            
            // Use stored pause time if available or calculate new time
            let newTime;
            if (pausedTimeRef && pausedTimeRef.current !== null) {
              newTime = pausedTimeRef.current;
              pausedTimeRef.current = null;
            } else {
              // Calculate new time based on elapsed time
              newTime = Math.max(0, timeRemaining - elapsedSeconds);
            }
            
            // If timer completed while away
            if (newTime <= 0) {
              setTimeRemaining(0);
              setIsRunning(false);
              setTimeout(() => handleTimerComplete(), 0);
            } else {
              // Update the time remaining
              setTimeRemaining(newTime);
              // Update last tick time
              lastTickTimeRef.current = now;
            }
          }
        }
      }
    };
    
    // Add and remove event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, timeRemaining, setTimeRemaining, handleTimerComplete, lastTickTimeRef, setIsRunning, pausedTimeRef]);
}
