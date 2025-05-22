
import { useEffect, useRef } from 'react';

interface UseTimerVisibilityHandlerProps {
  isRunning: boolean;
  timeRemaining: number;
  setTimeRemaining: (time: number) => void;
  lastTickTimeRef: React.MutableRefObject<number>;
  handleTimerComplete: () => void;
  timerMode: string;
}

export function useTimerVisibilityHandler({
  isRunning,
  timeRemaining,
  setTimeRemaining,
  lastTickTimeRef,
  handleTimerComplete,
  timerMode
}: UseTimerVisibilityHandlerProps) {
  // Keep track of when the visibility changed
  const visibilityChangedAtRef = useRef<number | null>(null);
  
  // Store the timer mode when tab was hidden
  const hiddenModeRef = useRef<string | null>(null);
  
  // Handle visibility changes (tab switching, window focus)
  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden, record the current time and mode
        visibilityChangedAtRef.current = Date.now();
        hiddenModeRef.current = timerMode;
        console.log('Tab hidden, recording exact time:', visibilityChangedAtRef.current, 'with mode:', hiddenModeRef.current);
        
        // Store timer context in window object for cross-tab synchronization
        window.timerContext = {
          ...window.timerContext,
          timeRemaining,
          isRunning,
          timerMode
        };
      } else if (visibilityChangedAtRef.current !== null) {
        // Tab became visible again
        const now = Date.now();
        const elapsedMs = now - visibilityChangedAtRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        console.log('Tab visible after precisely', elapsedSeconds, 'seconds (', elapsedMs, 'ms)');
        
        // Update last tick time for the main timer
        lastTickTimeRef.current = now;
        visibilityChangedAtRef.current = null;
        
        // Only update if significant time has passed
        if (elapsedSeconds > 0) {
          // Check if mode changed while tab was hidden
          const modeChanged = hiddenModeRef.current !== timerMode;
          console.log('Mode check on tab return:', { 
            previousMode: hiddenModeRef.current, 
            currentMode: timerMode, 
            modeChanged 
          });
          
          // Clean hidden mode ref
          hiddenModeRef.current = null;
          
          // Calculate new remaining time
          const newTimeRemaining = Math.max(0, timeRemaining - elapsedSeconds);
          console.log('Adjusting timer from', timeRemaining, 'to', newTimeRemaining);
          
          // Update timer
          setTimeRemaining(newTimeRemaining);
          
          // Update document title immediately to match current time
          if (window.timerContext && typeof window.timerContext.updateDocumentTitle === 'function') {
            setTimeout(() => {
              window.timerContext.updateDocumentTitle();
            }, 0);
          }
          
          // CRITICAL: If timer should have completed, handle it
          // Also handle the case where mode changed while tab was hidden - resume the timer
          if (newTimeRemaining === 0 || modeChanged) {
            // Force timer to resume if it changed modes while tab was hidden
            if (modeChanged && isRunning) {
              console.log('Mode changed while tab was hidden. Ensuring timer is running in new mode');
              setTimeout(() => {
                // Force a state update to ensure the timer is running in the new mode
                window.timerContext?.onVisibilityChange?.();
              }, 0);
            }
            
            // Handle timer completion if needed
            if (newTimeRemaining === 0) {
              handleTimerComplete();
            }
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
  }, [isRunning, timeRemaining, setTimeRemaining, lastTickTimeRef, handleTimerComplete, timerMode]);
}
