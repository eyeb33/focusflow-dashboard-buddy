
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
  
  // Timer tick logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            onTimerComplete();
            return 0;
          }
          
          const newTime = prevTime - 1;
          const totalTime = getTotalTime();
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = Math.floor((totalTime - prevTime) / 60);
          
          if (user && newFullMinutes > prevFullMinutes) {
            console.log(`Completed a new minute: ${newFullMinutes} minutes`);
            
            if (timerMode === 'work') {
              savePartialSession(
                user.id, 
                timerMode, 
                totalTime, 
                newTime, 
                lastRecordedFullMinutesRef.current
              ).then((result) => {
                // Fix the type error by checking if result has the property
                if (result && typeof result === 'object' && 'newFullMinutes' in result) {
                  lastRecordedFullMinutesRef.current = result.newFullMinutes;
                } else {
                  // Just update with current calculation if no explicit value returned
                  lastRecordedFullMinutesRef.current = newFullMinutes;
                }
              });
            }
          }
          
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
