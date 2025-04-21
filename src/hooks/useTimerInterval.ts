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
  const timerStateRef = useRef({
    isRunning,
    timerMode,
    timeRemaining,
    totalTime: getTotalTime()
  });
  
  // Keep a reference to the current timer state
  useEffect(() => {
    timerStateRef.current = {
      isRunning,
      timerMode,
      timeRemaining,
      totalTime: getTotalTime()
    };
  }, [isRunning, timerMode, timeRemaining, getTotalTime]);
  
  // Store timer state in localStorage for persistence
  useEffect(() => {
    if (isRunning) {
      localStorage.setItem('timerState', JSON.stringify({
        isRunning,
        timerMode,
        timeRemaining,
        totalTime: getTotalTime(),
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem('timerState');
    }
  }, [isRunning, timerMode, timeRemaining, getTotalTime]);
  
  // Restore timer state when the component mounts
  useEffect(() => {
    const storedStateStr = localStorage.getItem('timerState');
    if (storedStateStr) {
      try {
        const storedState = JSON.parse(storedStateStr);
        const elapsedMs = Date.now() - storedState.timestamp;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Only restore if timer was running and less time has passed than remaining
        if (storedState.isRunning && elapsedSeconds < storedState.timeRemaining) {
          const newTimeRemaining = Math.max(0, storedState.timeRemaining - elapsedSeconds);
          setTimeRemaining(newTimeRemaining);
          
          // Update last tick time
          lastTickTimeRef.current = Date.now();
        } else if (storedState.isRunning && elapsedSeconds >= storedState.timeRemaining) {
          // Timer should have completed while away
          setTimeout(() => onTimerComplete(), 0);
          localStorage.removeItem('timerState');
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        localStorage.removeItem('timerState');
      }
    }
  }, []);
  
  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, save last tick time
        lastTickTimeRef.current = Date.now();
        visibilityChangeRef.current = true;
      } else if (visibilityChangeRef.current && timerStateRef.current.isRunning) {
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
  }, [onTimerComplete, setTimeRemaining]);
  
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
          
          // Update localStorage with new timer state
          localStorage.setItem('timerState', JSON.stringify({
            isRunning: true,
            timerMode,
            timeRemaining: newTime,
            totalTime: getTotalTime(),
            timestamp: now
          }));
          
          // If timer should have completed
          if (newTime <= 0) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            setTimeout(() => onTimerComplete(), 0);
            localStorage.removeItem('timerState');
            return 0;
          }
          
          // Update reference time for next tick
          lastTickTimeRef.current = now;
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      // If timer is stopped, clear the interval and localStorage
      clearInterval(timerRef.current);
      localStorage.removeItem('timerState');
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerMode, user, getTotalTime, onTimerComplete, setTimeRemaining, lastRecordedFullMinutesRef]);
  
  return timerRef;
}
