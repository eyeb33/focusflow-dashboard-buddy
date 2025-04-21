
import { useEffect, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useAuth } from '@/contexts/AuthContext';
import { savePartialSession } from '@/utils/timerContextUtils';

interface UseTimerIntervalProps {
  isRunning: boolean;
  timerMode: TimerMode;
  timeRemaining: number;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  getTotalTime: () => number;
  onTimerComplete: () => void;
  lastRecordedFullMinutesRef: React.MutableRefObject<number>;
}

export function useTimerInterval({
  isRunning,
  timerMode,
  timeRemaining,
  setTimeRemaining,
  getTotalTime,
  onTimerComplete,
  lastRecordedFullMinutesRef
}: UseTimerIntervalProps) {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const visibilityChangeRef = useRef<boolean>(false);
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, save last tick time
        lastTickTimeRef.current = Date.now();
        visibilityChangeRef.current = true;
      } else if (visibilityChangeRef.current && isRunning) {
        // Page is visible again and timer was running
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        if (elapsedSeconds >= 1) {
          console.log(`Tab was hidden for ${elapsedSeconds} seconds`);
          
          // Adjust the timer
          setTimeRemaining(prevTime => {
            const newTime = Math.max(0, prevTime - elapsedSeconds);
            
            // If timer should have completed while away
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
  }, [isRunning, onTimerComplete, setTimeRemaining]);
  
  // Timer tick logic
  useEffect(() => {
    if (isRunning) {
      // Store current time for accurate timing
      lastTickTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const expectedElapsed = 1000; // 1 second in milliseconds
        const actualElapsed = now - lastTickTimeRef.current;
        
        // Adjust timing if browser throttled our timer
        const adjustment = Math.max(0, Math.floor((actualElapsed - expectedElapsed) / 1000));
        
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            onTimerComplete();
            return 0;
          }
          
          // Subtract 1 second plus any adjustment needed
          const secondsToSubtract = 1 + adjustment;
          const newTime = Math.max(0, prevTime - secondsToSubtract);
          
          // Calculate timing values for database updates
          const totalTime = getTotalTime();
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = lastRecordedFullMinutesRef.current;
          
          // Save progress if we've reached a new full minute and in work mode
          if (user && timerMode === 'work' && newFullMinutes > prevFullMinutes) {
            console.log(`Completed a new minute: ${newFullMinutes} minutes`);
            
            savePartialSession(
              user.id, 
              timerMode, 
              totalTime, 
              newTime, 
              lastRecordedFullMinutesRef.current
            ).then((result) => {
              // Fix type error by properly type narrowing the result
              if (result && typeof result === 'object' && 'newFullMinutes' in result) {
                lastRecordedFullMinutesRef.current = result.newFullMinutes;
              } else {
                // Just update with current calculation if no explicit value returned
                lastRecordedFullMinutesRef.current = newFullMinutes;
              }
            });
          }
          
          // If timer should have completed
          if (newTime <= 0) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            setTimeout(() => onTimerComplete(), 0);
            return 0;
          }
          
          // Update reference time for next tick
          lastTickTimeRef.current = now;
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerMode, user, getTotalTime, onTimerComplete, setTimeRemaining, lastRecordedFullMinutesRef]);
  
  return timerRef;
}
