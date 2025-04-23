
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastTickTimeRef.current = Date.now();
        visibilityChangeRef.current = true;
      } else if (visibilityChangeRef.current && timerStateRef.current.isRunning) {
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);

        if (elapsedSeconds >= 1) {
          console.log(`Tab was hidden for ${elapsedSeconds} seconds`);

          setTimeRemaining(prevTime => {
            const newTime = Math.max(0, prevTime - elapsedSeconds);
            
            // Force UI update immediately after visibility change
            setTimeout(() => {
              if (window.timerContext && window.timerContext.updateDisplay) {
                window.timerContext.updateDisplay(newTime);
              }
            }, 0);

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

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onTimerComplete, setTimeRemaining, timerMode, timerStateRef, lastTickTimeRef]);
}
