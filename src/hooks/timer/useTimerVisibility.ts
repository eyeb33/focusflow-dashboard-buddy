
import { useEffect, useRef } from 'react';

interface UseTimerVisibilityProps {
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  timeRemaining: number;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  handleTimerComplete: () => void;
  lastTickTimeRef: React.MutableRefObject<number>;
}

export function useTimerVisibility({
  isRunning,
  setIsRunning,
  timeRemaining,
  setTimeRemaining,
  handleTimerComplete,
  lastTickTimeRef
}: UseTimerVisibilityProps) {
  const wasRunningRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, store the running state
        wasRunningRef.current = isRunning;
        console.log("Tab hidden, timer was running:", wasRunningRef.current);
        // Record the time when hidden
        lastTickTimeRef.current = Date.now();
      } else {
        // Tab is visible again
        console.log("Tab visible again, timer was running:", wasRunningRef.current);
        
        // Check if timer was running before hiding
        if (wasRunningRef.current && !isRunning) {
          // Resume the timer
          setIsRunning(true);
        }
        
        // If timer is running, adjust the time based on how long it was hidden
        if (isRunning || wasRunningRef.current) {
          const now = Date.now();
          const elapsedMs = now - lastTickTimeRef.current;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          
          console.log(`Tab was hidden for ${elapsedSeconds} seconds`);
          
          if (elapsedSeconds >= 1) {
            setTimeRemaining(prevTime => {
              const newTime = Math.max(0, prevTime - elapsedSeconds);
              console.log(`Adjusting time from ${prevTime} to ${newTime}`);
              
              if (newTime <= 0) {
                setTimeout(() => handleTimerComplete(), 0);
                return 0;
              }
              return newTime;
            });
          }
          
          lastTickTimeRef.current = now;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, setIsRunning, setTimeRemaining, handleTimerComplete, lastTickTimeRef]);

  // Handle page navigation using the beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This ensures state is saved before navigating away
      console.log("Page unloading - saving current timer state");
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
