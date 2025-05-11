import { useEffect, useRef } from 'react';

interface UseTimerVisibilityHandlerProps {
  isRunning: boolean;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  lastTickTimeRef: React.MutableRefObject<number>;
  handleTimerComplete: () => void;
}

export function useTimerVisibilityHandler({
  isRunning,
  timeRemaining,
  setTimeRemaining,
  lastTickTimeRef,
  handleTimerComplete
}: UseTimerVisibilityHandlerProps) {
  // Keep track of when the visibility changed
  const visibilityChangedAtRef = useRef<number | null>(null);
  
  // Handle visibility changes (tab switching, window focus)
  useEffect(() => {
    // Only set up visibility handling if timer is running
    if (!isRunning) return;
    
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden, record the current time
        visibilityChangedAtRef.current = Date.now();
        console.log('Tab hidden, recording exact time:', visibilityChangedAtRef.current);
      } else if (visibilityChangedAtRef.current !== null) {
        // Tab became visible, calculate elapsed time precisely
        const now = Date.now();
        const elapsedMs = now - visibilityChangedAtRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        console.log('Tab visible after precisely', elapsedSeconds, 'seconds (', elapsedMs, 'ms)');
        
        // Update last tick time for the main timer
        lastTickTimeRef.current = now;
        visibilityChangedAtRef.current = null;
        
        // Only update if significant time has passed
        if (elapsedSeconds > 0) {
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
