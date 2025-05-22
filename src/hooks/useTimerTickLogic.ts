
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
  const lastKnownTimeRef = useRef<number>(timeRemaining);
  const previousIsRunningRef = useRef<boolean>(false);
  const isPausingRef = useRef<boolean>(false);
  
  // Update the ref whenever timeRemaining changes to keep track of the latest value
  useEffect(() => {
    lastKnownTimeRef.current = timeRemaining;
    
    // When pausing (transitioning from running to not running)
    if (!isRunning && previousIsRunningRef.current) {
      isPausingRef.current = true;
      console.log("Timer paused - Preserving exact current time:", lastKnownTimeRef.current);
    } else {
      isPausingRef.current = false;
    }
    
    // Update previous running state
    previousIsRunningRef.current = isRunning;
  }, [timeRemaining, isRunning]);
  
  // Debug the incoming isRunning state
  console.log(`useTimerTickLogic - isRunning: ${isRunning}, timerMode: ${timerMode}, timeRemaining: ${timeRemaining}`);

  useEffect(() => {
    console.log(`Timer tick effect running - isRunning: ${isRunning}, time: ${timeRemaining}`);
    
    // Critical: Always clear any existing timer first to prevent multiple timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Cleared existing timer interval");
    }
    
    // When pausing, ensure we save the current state
    if (!isRunning && previousIsRunningRef.current) {
      console.log("Timer paused - Preserving exact current time:", lastKnownTimeRef.current);
      
      const timerState = {
        isRunning: false,
        timerMode,
        timeRemaining: lastKnownTimeRef.current, // Use the ref to get the most accurate time
        totalTime: getTotalTime(),
        timestamp: Date.now(),
        sessionStartTime: sessionStartTimeRef.current
      };
      
      localStorage.setItem('timerState', JSON.stringify(timerState));
    }
    
    if (isRunning) {
      console.log("Starting timer tick with mode:", timerMode, "and time:", timeRemaining);
      lastTickTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const actualElapsed = now - lastTickTimeRef.current;
        
        // Only update if at least 1 second has passed
        if (actualElapsed >= 1000) {
          // Calculate adjustment if timer drift occurs
          const secondsToSubtract = Math.max(1, Math.floor(actualElapsed / 1000));
          
          setTimeRemaining(prevTime => {
            // Debug with less frequent logging (only every 5 seconds)
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
            
            // Update document title to match current time
            if (window.timerContext && typeof window.timerContext.updateDocumentTitle === 'function') {
              window.timerContext.updateDocumentTitle();
            }
            
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
              
              // Corrected: Check if result exists and has the right property before using it
              if (result) {
                // We need to handle this properly since savePartialSession returns a Promise
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
            
            // Keep track of the current time
            lastKnownTimeRef.current = newTime;
            lastTickTimeRef.current = now;
            return newTime;
          });
        }
      }, 200); // Check more frequently for smoother updates
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
  ]); // Removed timeRemaining from dependencies to prevent reset loops

  return timerRef;
}
