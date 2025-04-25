
import { useEffect, useRef } from 'react';

interface UseTimerVisibilitySyncProps {
  isRunning: boolean;
  timerMode: string;
  timerStateRef: React.MutableRefObject<any>;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  onTimerComplete: () => void;
  lastTickTimeRef: React.MutableRefObject<number>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
}

export function useTimerVisibilitySync({
  isRunning,
  timerMode,
  timerStateRef,
  setTimeRemaining,
  onTimerComplete,
  lastTickTimeRef,
  sessionStartTimeRef
}: UseTimerVisibilitySyncProps) {
  const visibilityChangeRef = useRef<boolean>(false);
  const lastVisibilityChangeTime = useRef<number>(0);
  
  // This effect handles tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Prevent multiple rapid fire events (browser quirk)
      const now = Date.now();
      if (now - lastVisibilityChangeTime.current < 100) {
        return;
      }
      lastVisibilityChangeTime.current = now;
      
      if (document.hidden) {
        // Tab is hidden, store the current time
        console.log("Tab hidden - storing current time");
        lastTickTimeRef.current = Date.now();
        visibilityChangeRef.current = true;
        
        // Note: we don't pause the timer when tab is hidden
        // Just record when it happened for time adjustment on return
      } else if (visibilityChangeRef.current && timerStateRef.current.isRunning) {
        // Tab is visible again and timer was running
        console.log("Tab visible again - adjusting timer");
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        console.log(`Tab was hidden for ${elapsedSeconds} seconds`);

        if (elapsedSeconds >= 1) {
          setTimeRemaining(prevTime => {
            const newTime = Math.max(0, prevTime - elapsedSeconds);
            console.log(`Adjusting time from ${prevTime} to ${newTime}`);

            if (newTime <= 0) {
              setTimeout(() => onTimerComplete(), 0);
              return 0;
            }
            return newTime;
          });
        }

        visibilityChangeRef.current = false;
        lastTickTimeRef.current = now;
      }
    };

    // Register visibility change handler
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Register beforeunload handler to save state before page refresh/close
    const handleBeforeUnload = () => {
      // If timer is running, save state to localStorage
      if (isRunning) {
        const state = {
          isRunning,
          timerMode,
          timeRemaining: timerStateRef.current.timeRemaining,
          sessionStartTime: sessionStartTimeRef.current,
          timestamp: Date.now()
        };
        localStorage.setItem('timerStateBeforeUnload', JSON.stringify(state));
        console.log("Saved timer state before unload:", state);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onTimerComplete, setTimeRemaining, timerMode, timerStateRef, isRunning, lastTickTimeRef, sessionStartTimeRef]);
}
