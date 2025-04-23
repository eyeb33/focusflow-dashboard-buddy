
import { useEffect, useRef } from 'react';
import { savePartialSession } from '@/utils/timerContextUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseTimerTickLogicProps {
  isRunning: boolean;
  timerMode: string;
  getTotalTime: () => number;
  onTimerComplete: () => void;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  timeRemaining: number; // Added missing timeRemaining prop
  lastRecordedFullMinutesRef: React.MutableRefObject<number>;
  lastTickTimeRef: React.MutableRefObject<number>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
}

export function useTimerTickLogic({
  isRunning,
  timerMode,
  getTotalTime,
  onTimerComplete,
  setTimeRemaining,
  timeRemaining, // Add timeRemaining to destructured props
  lastRecordedFullMinutesRef,
  lastTickTimeRef,
  sessionStartTimeRef
}: UseTimerTickLogicProps) {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef<number | null>(null);
  
  // Debug the incoming isRunning state
  console.log(`useTimerTickLogic - isRunning: ${isRunning}, timerMode: ${timerMode}`);

  useEffect(() => {
    // Critical: Always clear any existing timer first to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Cleared existing timer interval");
    }
    
    if (isRunning) {
      console.log("Starting timer tick with mode:", timerMode);
      lastTickTimeRef.current = Date.now();

      // When starting or resuming, get the current state but don't modify it
      setTimeRemaining(prevTime => {
        currentTimeRef.current = prevTime;
        return prevTime; // Return unchanged to preserve the time
      });

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const expectedElapsed = 1000;
        const actualElapsed = now - lastTickTimeRef.current;
        
        const adjustment = Math.max(0, Math.floor((actualElapsed - expectedElapsed) / 1000));

        setTimeRemaining(prevTime => {
          // Always store the current time for pause state reference
          currentTimeRef.current = prevTime;
          console.log("Timer tick - Current time:", prevTime);
          
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setTimeout(() => onTimerComplete(), 0);
            return 0;
          }

          const secondsToSubtract = 1 + adjustment;
          const newTime = Math.max(0, prevTime - secondsToSubtract);
          console.log("Timer tick - New time:", newTime);

          const totalTime = getTotalTime();
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = lastRecordedFullMinutesRef.current;

          if (user && timerMode === 'work' && newFullMinutes > prevFullMinutes) {
            console.log(`Completed a new minute: ${newFullMinutes} minutes`);
            const startDate = sessionStartTimeRef.current
              ? new Date(sessionStartTimeRef.current).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];

            savePartialSession(
              user.id, 
              timerMode,
              totalTime,
              newTime,
              lastRecordedFullMinutesRef.current,
              startDate
            ).then((result) => {
              if (result && typeof result === 'object' && 'newFullMinutes' in result) {
                lastRecordedFullMinutesRef.current = result.newFullMinutes;
              } else {
                lastRecordedFullMinutesRef.current = newFullMinutes;
              }
            });
          }

          const timerState = {
            isRunning: true,
            timerMode,
            timeRemaining: newTime,
            totalTime: getTotalTime(),
            timestamp: now,
            sessionStartTime: sessionStartTimeRef.current
          };
          localStorage.setItem('timerState', JSON.stringify(timerState));

          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setTimeout(() => onTimerComplete(), 0);
            return 0;
          }

          lastTickTimeRef.current = now;
          return newTime;
        });
      }, 1000);
    } else if (isRunning === false) {
      // CRITICAL FIX: When pausing, do not modify the timeRemaining state at all
      console.log("Timer paused - Preserving exact current time");
      
      // Get the current time from our ref or state
      const pausedTime = currentTimeRef.current !== null ? currentTimeRef.current : timeRemaining;
      
      const timerState = {
        isRunning: false,
        timerMode,
        timeRemaining: pausedTime,
        totalTime: getTotalTime(),
        timestamp: Date.now(),
        sessionStartTime: sessionStartTimeRef.current
      };
      
      console.log("Saving paused timer state with exact time:", timerState);
      localStorage.setItem('timerState', JSON.stringify(timerState));
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    isRunning,
    timerMode,
    user,
    getTotalTime,
    onTimerComplete,
    setTimeRemaining,
    timeRemaining, // Add timeRemaining to dependency array
    lastRecordedFullMinutesRef,
    lastTickTimeRef,
    sessionStartTimeRef
  ]);

  return timerRef;
}
