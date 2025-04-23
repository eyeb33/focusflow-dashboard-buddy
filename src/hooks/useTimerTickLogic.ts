
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

  useEffect(() => {
    if (isRunning) {
      lastTickTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const expectedElapsed = 1000;
        const actualElapsed = now - lastTickTimeRef.current;
        const adjustment = Math.max(0, Math.floor((actualElapsed - expectedElapsed) / 1000));

        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            onTimerComplete();
            return 0;
          }

          const secondsToSubtract = 1 + adjustment;
          const newTime = Math.max(0, prevTime - secondsToSubtract);

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
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            setTimeout(() => onTimerComplete(), 0);
            localStorage.removeItem('timerState');
            return 0;
          }

          lastTickTimeRef.current = now;
          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
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
    lastRecordedFullMinutesRef,
    lastTickTimeRef,
    sessionStartTimeRef
  ]);

  return timerRef;
}
