
import { useEffect, useRef } from 'react';
import { savePartialSession } from '@/utils/timerContextUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseTimerTickLogicProps {
  isRunning: boolean;
  timerMode: string;
  getTotalTime: () => number;
  onTimerComplete: () => void;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
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
  lastRecordedFullMinutesRef,
  lastTickTimeRef,
  sessionStartTimeRef
}: UseTimerTickLogicProps) {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Effect to handle the timer interval
  useEffect(() => {
    // Clear any existing interval first to prevent duplicate timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      // Set the last tick time to now when starting
      lastTickTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const expectedElapsed = 1000; // 1 second
        const actualElapsed = now - lastTickTimeRef.current;
        
        // Adjust only if there's a significant delay (more than 1 second)
        const adjustment = Math.max(0, Math.floor((actualElapsed - expectedElapsed) / 1000));

        setTimeRemaining(prevTime => {
          // If timer is about to complete
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setTimeout(() => onTimerComplete(), 0);
            return 0;
          }

          // Calculate new time
          const secondsToSubtract = 1 + adjustment;
          const newTime = Math.max(0, prevTime - secondsToSubtract);

          const totalTime = getTotalTime();
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = lastRecordedFullMinutesRef.current;

          // Save session data for work mode if user is logged in
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

          // Save timer state to localStorage
          const timerState = {
            isRunning: true,
            timerMode,
            timeRemaining: newTime,
            totalTime: getTotalTime(),
            timestamp: now,
            sessionStartTime: sessionStartTimeRef.current
          };
          localStorage.setItem('timerState', JSON.stringify(timerState));

          // Handle timer completion
          if (newTime <= 0) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            setTimeout(() => onTimerComplete(), 0);
            localStorage.removeItem('timerState');
            return 0;
          }

          lastTickTimeRef.current = now;
          return newTime;
        });
      }, 1000);
    } else {
      // If not running but we have timer state, save it to localStorage
      setTimeRemaining(prevTime => {
        const timerState = {
          isRunning: false,
          timerMode,
          timeRemaining: prevTime,
          totalTime: getTotalTime(),
          timestamp: Date.now(),
          sessionStartTime: sessionStartTimeRef.current
        };
        localStorage.setItem('timerState', JSON.stringify(timerState));
        return prevTime;
      });
    }

    // Cleanup function
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
    lastRecordedFullMinutesRef,
    lastTickTimeRef,
    sessionStartTimeRef
  ]);

  return timerRef;
}
