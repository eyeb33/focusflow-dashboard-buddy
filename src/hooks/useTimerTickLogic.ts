
import { useEffect, useRef } from 'react';
import { savePartialSession } from '@/utils/timerContextUtils';
import { useAuth } from '@/contexts/AuthContext';
import { trackTimerTick } from '@/utils/debugUtils';

interface UseTimerTickLogicProps {
  isRunning: boolean;
  timerMode: string;
  getTotalTime: () => number;
  onTimerComplete: () => void;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  timeRemaining: number;
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
  timeRemaining,
  lastRecordedFullMinutesRef,
  lastTickTimeRef,
  sessionStartTimeRef
}: UseTimerTickLogicProps) {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentTimeRef = useRef<number | null>(null);
  
  // Debug the incoming isRunning state
  console.log(`useTimerTickLogic - isRunning: ${isRunning}, timerMode: ${timerMode}, timeRemaining: ${timeRemaining}`);

  useEffect(() => {
    // Critical: Always clear any existing timer first to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Cleared existing timer interval");
    }
    
    if (isRunning) {
      console.log("Starting timer tick with mode:", timerMode, "and time:", timeRemaining);
      lastTickTimeRef.current = Date.now();

      // When starting or resuming, store the current time but don't modify it
      currentTimeRef.current = timeRemaining;

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const expectedElapsed = 1000;
        const actualElapsed = now - lastTickTimeRef.current;
        
        // Calculate adjustment if timer drift occurs (more than 100ms off)
        const adjustment = Math.max(0, Math.floor((actualElapsed - expectedElapsed) / 1000));
        
        console.log("Timer tick: remaining =", timeRemaining, "adjustment =", adjustment);

        setTimeRemaining(prevTime => {
          // Always store the current time for pause state reference
          currentTimeRef.current = prevTime;
          
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setTimeout(() => onTimerComplete(), 0);
            return 0;
          }

          const secondsToSubtract = 1 + adjustment;
          const newTime = Math.max(0, prevTime - secondsToSubtract);
          
          // Track this tick for debugging purposes
          trackTimerTick(prevTime, newTime, timerMode, now);

          const totalTime = getTotalTime();
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = lastRecordedFullMinutesRef.current;

          // Save partial session at minute boundaries
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

          // Update timer state in localStorage (for tab switching/visibility)
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
              timerRef.current = null;
            }
            setTimeout(() => onTimerComplete(), 0);
            return 0;
          }

          lastTickTimeRef.current = now;
          return newTime;
        });
      }, 1000);
    } else if (!isRunning) {
      // When pausing, preserve the exact current time
      console.log("Timer paused - Preserving exact current time:", timeRemaining);
      
      const timerState = {
        isRunning: false,
        timerMode,
        timeRemaining: timeRemaining,
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
        timerRef.current = null;
      }
    };
  }, [
    isRunning,
    timerMode,
    user,
    getTotalTime,
    onTimerComplete,
    setTimeRemaining,
    lastRecordedFullMinutesRef,
    lastTickTimeRef,
    sessionStartTimeRef
  ]);

  return timerRef;
}
