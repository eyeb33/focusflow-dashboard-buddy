
import { useEffect, useRef } from 'react';
import { savePartialSession } from '@/utils/timerContextUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseTimerTickLogicProps {
  isRunning: boolean;
  timerMode: string;
  getTotalTime: () => number;
  onTimerComplete: () => void;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  timeRemaining: number; // Add timeRemaining to the props
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
  timeRemaining, // Add timeRemaining here
  lastRecordedFullMinutesRef,
  lastTickTimeRef,
  sessionStartTimeRef
}: UseTimerTickLogicProps) {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestAnimationFrameRef = useRef<number | null>(null);
  const previousIsRunningRef = useRef(isRunning);

  // Function to update the timer display
  const updateTimerDisplay = (newTime: number) => {
    // Update React state for the timer display
    setTimeRemaining(newTime);
    
    // Update the global window context for debugging
    if (window.timerContext) {
      window.timerContext.timeRemaining = newTime;
    }

    // For animation frame loop
    if (isRunning) {
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
      }
      
      requestAnimationFrameRef.current = requestAnimationFrame(() => {
        // This ensures the browser repaints the timer even if tab is inactive
        document.title = `Timer: ${Math.floor(newTime / 60)}:${String(newTime % 60).padStart(2, '0')}`;
        
        // Update the UI through the global context if it exists
        if (window.timerContext && window.timerContext.updateDisplay) {
          window.timerContext.updateDisplay(newTime);
        }
      });
    }
  };

  // Main timer tick effect
  useEffect(() => {
    // Track state changes for debugging
    if (isRunning !== previousIsRunningRef.current) {
      console.log(`Timer state changed: ${isRunning ? 'started' : 'stopped'}`);
      previousIsRunningRef.current = isRunning;
      
      // Force UI update when timer starts/stops
      if (window.timerContext && window.timerContext.updateDisplay) {
        window.timerContext.updateDisplay(timeRemaining);
      }
    }
    
    // Clean up any existing interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      lastTickTimeRef.current = Date.now();
      console.log("Timer is running. Initial time:", lastTickTimeRef.current);

      // Set up the interval for the timer
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const expectedElapsed = 1000;
        const actualElapsed = now - lastTickTimeRef.current;
        const adjustment = Math.max(0, Math.floor((actualElapsed - expectedElapsed) / 1000));

        const totalTime = getTotalTime();
        
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            if (requestAnimationFrameRef.current) {
              cancelAnimationFrame(requestAnimationFrameRef.current);
            }
            onTimerComplete();
            return 0;
          }

          const secondsToSubtract = 1 + adjustment;
          const newTime = Math.max(0, prevTime - secondsToSubtract);

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

          // Save the timer state to localStorage for persistence
          const timerState = {
            isRunning: true,
            timerMode,
            timeRemaining: newTime,
            totalTime: getTotalTime(),
            timestamp: now,
            sessionStartTime: sessionStartTimeRef.current
          };
          localStorage.setItem('timerState', JSON.stringify(timerState));

          // Force UI update with requestAnimationFrame
          updateTimerDisplay(newTime);

          if (newTime <= 0) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            if (requestAnimationFrameRef.current) {
              cancelAnimationFrame(requestAnimationFrameRef.current);
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
      console.log("Timer stopped. Clearing interval");
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
        requestAnimationFrameRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (requestAnimationFrameRef.current) {
        cancelAnimationFrame(requestAnimationFrameRef.current);
        requestAnimationFrameRef.current = null;
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
    timeRemaining
  ]);

  return timerRef;
}
