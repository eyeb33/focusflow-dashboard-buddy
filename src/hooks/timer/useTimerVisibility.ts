
import { useEffect, useRef } from 'react';

interface UseTimerVisibilityProps {
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  handleTimerComplete: () => void;
  lastTickTimeRef: React.MutableRefObject<number>;
}

export function useTimerVisibility({
  isRunning,
  timeRemaining,
  setIsRunning,
  setTimeRemaining,
  handleTimerComplete,
  lastTickTimeRef
}: UseTimerVisibilityProps) {
  // Store the visibility state
  const isVisibleRef = useRef<boolean>(true);
  
  useEffect(() => {
    // Visibility change handler
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isVisibleRef.current = isVisible;
      console.log("Document visibility changed:", isVisible ? "visible" : "hidden");
      
      if (isVisible && isRunning) {
        // Calculate elapsed time while the page was hidden
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        console.log(`Page became visible. ${elapsedSeconds}s elapsed since last tick.`);
        
        // Update the timer
        if (elapsedSeconds >= 1) {
          lastTickTimeRef.current = now;
          
          // Calculate new time remaining
          const newTimeRemaining = Math.max(0, timeRemaining - elapsedSeconds);
          setTimeRemaining(newTimeRemaining);
          
          // If timer has completed while hidden, handle completion
          if (newTimeRemaining === 0 && timeRemaining > 0) {
            console.log("Timer completed while page was hidden");
            handleTimerComplete();
          }
        }
      }
    };
    
    // Register handlers
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, timeRemaining, setTimeRemaining, handleTimerComplete, lastTickTimeRef]);
}
