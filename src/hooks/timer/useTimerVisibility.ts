
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
  // Handle visibility changes (tab switching, window focus)
  useEffect(() => {
    // Only set up visibility handling if timer is running
    if (!isRunning) return;
    
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden, record the current time
        console.log('Tab hidden, recording time:', Date.now());
        lastTickTimeRef.current = Date.now();
      } else {
        // Tab became visible, calculate elapsed time
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastTickTimeRef.current) / 1000);
        console.log('Tab visible after', elapsedSeconds, 'seconds');
        
        // Update last tick time
        lastTickTimeRef.current = now;
        
        // Only update if significant time has passed
        if (elapsedSeconds > 1) {
          // Calculate new remaining time
          const newTimeRemaining = Math.max(0, timeRemaining - elapsedSeconds);
          console.log('Adjusting timer from', timeRemaining, 'to', newTimeRemaining);
          
          // Update timer
          setTimeRemaining(newTimeRemaining);
          
          // Handle timer completion if needed
          if (newTimeRemaining === 0) {
            handleTimerComplete();
          }
        }
      }
    };
    
    // Add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, timeRemaining, setTimeRemaining, lastTickTimeRef, handleTimerComplete]);
}
