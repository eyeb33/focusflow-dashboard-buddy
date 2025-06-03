
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
  const previousIsRunningRef = useRef<boolean>(false);
  
  console.log(`useTimerTickLogic - isRunning: ${isRunning}, timerMode: ${timerMode}, timeRemaining: ${timeRemaining}`);

  useEffect(() => {
    // Critical: Always clear any existing timer first to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Cleared existing timer interval");
    }
    
    // When pausing (transitioning from running to not running)
    if (!isRunning && previousIsRunningRef.current) {
      console.log("Timer paused - state preserved externally");
    }
    
    if (isRunning) {
      console.log("Starting timer tick with mode:", timerMode, "and time:", timeRemaining);
      lastTickTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const actualElapsed = now - lastTickTimeRef.current;
        
        // Only update if at least 1 second has passed
        if (actualElapsed >= 1000) {
          const secondsToSubtract = Math.max(1, Math.floor(actualElapsed / 1000));
          
          setTimeRemaining(prevTime => {
            // Debug with less frequent logging
            if (prevTime % 5 === 0 || prevTime <= 5) {
              console.log("Timer tick: remaining =", prevTime, "elapsed =", secondsToSubtract);
            }

            if (prevTime <= secondsToSubtract) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setTimeout(() => onTimerComplete(), 0);
              return 0;
            }

            const newTime = Math.max(0, prevTime - secondsToSubtract);
            
            // Update document title immediately after timer tick
            setTimeout(() => {
              if (window.timerContext && typeof window.timerContext.updateDocumentTitle === 'function') {
                window.timerContext.updateDocumentTitle();
              }
            }, 0);
            
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

              const result = savePartialSession(
                user.id, 
                timerMode,
                totalTime,
                newTime,
                lastRecordedFullMinutesRef.current,
                startDate
              );
              
              if (result) {
                Promise.resolve(result).then((resolvedResult) => {
                  if (resolvedResult && 'newFullMinutes' in resolvedResult) {
                    lastRecordedFullMinutesRef.current = resolvedResult.newFullMinutes;
                  } else {
                    lastRecordedFullMinutesRef.current = newFullMinutes;
                  }
                });
              } else {
                lastRecordedFullMinutesRef.current = newFullMinutes;
              }
            }

            // Update timer state in localStorage only when running
            const timerState = {
              isRunning: true,
              timerMode,
              timeRemaining: newTime,
              totalTime: getTotalTime(),
              timestamp: now,
              sessionStartTime: sessionStartTimeRef.current
            };
            localStorage.setItem('timerState', JSON.stringify(timerState));
            
            lastTickTimeRef.current = now;
            return newTime;
          });
        }
      }, 200);
    }
    
    // Update previous running state
    previousIsRunningRef.current = isRunning;

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
    sessionStartTimeRef,
  ]);

  return timerRef;
}
