
import { useEffect } from 'react';

interface UseTimerVisibilityProps {
  isRunning: boolean;
  timeRemaining: number;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
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
}: UseTimerVisibilityProps) {
  // Handle tab visibility changes
  useEffect(() => {
    // Only set up the visibility handler if the timer is running
    if (isRunning) {
      console.log('[useTimerVisibility] Setting up visibility change handler');
      
      const handleVisibilityChange = () => {
        const now = Date.now();
        
        if (document.visibilityState === 'visible') {
          console.log('[useTimerVisibility] Tab became visible');
          
          // Calculate elapsed time while away
          const elapsed = Math.floor((now - lastTickTimeRef.current) / 1000);
          lastTickTimeRef.current = now;
          
          if (elapsed > 0) {
            console.log(`[useTimerVisibility] ${elapsed} seconds elapsed while away`);
            
            setTimeRemaining((prevTime) => {
              const newTime = Math.max(0, prevTime - elapsed);
              console.log(`[useTimerVisibility] Updating time: ${prevTime} -> ${newTime}`);
              
              // Check if timer completed while away
              if (newTime === 0) {
                console.log('[useTimerVisibility] Timer completed while away, triggering completion handler');
                setTimeout(() => handleTimerComplete(), 0);
              }
              
              return newTime;
            });
          }
        } else {
          console.log('[useTimerVisibility] Tab became hidden, recording time');
          lastTickTimeRef.current = now;
        }
      };
      
      // Add visibility change event listener
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Clean up event listener
      return () => {
        console.log('[useTimerVisibility] Removing visibility change handler');
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isRunning, setTimeRemaining, lastTickTimeRef, handleTimerComplete]);
  
  // When this hook unmounts, we want to make sure we preserve the current time if paused
  useEffect(() => {
    return () => {
      if (!isRunning && timeRemaining > 0 && pausedTimeRef.current === null) {
        console.log('[useTimerVisibility] Component unmounting while paused, saving current time:', timeRemaining);
        pausedTimeRef.current = timeRemaining;
      }
    };
  }, [isRunning, timeRemaining, pausedTimeRef]);
  
  // Return nothing
  return null;
}
