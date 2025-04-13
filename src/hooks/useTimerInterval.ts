import { useEffect, useRef, useState } from 'react';
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
  
  // Timer tick logic with time drift compensation
  useEffect(() => {
    if (isRunning) {
      // Store the start time to calculate elapsed time
      lastTickTimeRef.current = Date.now();
      
      // Set up the timer interval
      timerRef.current = setInterval(() => {
        const now = Date.now();
        // Calculate elapsed time since last tick, handle tab inactive periods
        const elapsedTimeMs = now - lastTickTimeRef.current;
        lastTickTimeRef.current = now;
        
        // Calculate elapsed seconds (we need to round to handle potential 
        // small timing differences)
        const elapsedSeconds = Math.round(elapsedTimeMs / 1000);
        
        if (elapsedSeconds <= 0) return; // Skip if no meaningful time has passed
        
        setTimeRemaining(prevTime => {
          // Handle timer completion
          if (prevTime <= elapsedSeconds) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            // We'll handle the completion in a separate effect to ensure it runs
            setTimeout(() => onTimerComplete(), 0);
            return 0;
          }
          
          // Calculate new remaining time
          const newTime = prevTime - elapsedSeconds;
          const totalTime = getTotalTime();
          const elapsedTotalSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedTotalSeconds / 60);
          const prevFullMinutes = lastRecordedFullMinutesRef.current;
          
          // Only save partial session data for work modes and when a full minute completes
          if (user && timerMode === 'work' && newFullMinutes > prevFullMinutes) {
            console.log(`Completed a new minute: ${newFullMinutes} minutes`);
            
            savePartialSession(
              user.id, 
              timerMode, 
              totalTime, 
              newTime, 
              lastRecordedFullMinutesRef.current
            ).then(({ newFullMinutes }) => {
              lastRecordedFullMinutesRef.current = newFullMinutes;
            });
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      // When paused, clear the interval but keep the timeRemaining state
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerMode, user, getTotalTime, onTimerComplete, setTimeRemaining, lastRecordedFullMinutesRef]);
  
  // Enhanced localStorage implementation to preserve timer state when tab is inactive
  useEffect(() => {
    const saveTimerState = () => {
      if (isRunning) {
        localStorage.setItem('timerState', JSON.stringify({
          isRunning,
          timerMode,
          timeRemaining,
          lastTickTime: Date.now(),
          lastRecordedFullMinutes: lastRecordedFullMinutesRef.current
        }));
      }
    };

    // Save timer state when timer is running or when tab is hidden/closed
    if (isRunning) {
      saveTimerState();
      
      // Set up event listeners for page visibility changes
      document.addEventListener('visibilitychange', saveTimerState);
      window.addEventListener('beforeunload', saveTimerState);
      
      // Set up a periodic save to ensure state is updated even during long periods of inactivity
      const periodicSaveInterval = setInterval(saveTimerState, 5000);
      
      return () => {
        document.removeEventListener('visibilitychange', saveTimerState);
        window.removeEventListener('beforeunload', saveTimerState);
        clearInterval(periodicSaveInterval);
      };
    }

    return undefined;
  }, [isRunning, timerMode, timeRemaining, lastRecordedFullMinutesRef]);
  
  return timerRef;
}
