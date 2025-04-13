
import { useAuth } from '@/contexts/AuthContext';
import { savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerControlsParams {
  timerMode: TimerMode;
  settings: TimerSettings;
  timeRemaining: number;
  isRunning: boolean;
  setTimerMode: (mode: TimerMode) => void;
  setTimeRemaining: (time: React.SetStateAction<number>) => void;
  setIsRunning: (value: React.SetStateAction<boolean>) => void;
  getTotalTime: (mode: TimerMode, settings: TimerSettings) => number;
  lastRecordedTimeRef: React.MutableRefObject<number | null>;
  lastRecordedFullMinutesRef: React.MutableRefObject<number>;
}

export function useTimerControls({
  timerMode,
  settings,
  timeRemaining,
  isRunning,
  setTimerMode,
  setTimeRemaining,
  setIsRunning,
  getTotalTime,
  lastRecordedTimeRef,
  lastRecordedFullMinutesRef
}: TimerControlsParams) {
  const { user } = useAuth();

  const handleStart = () => {
    console.log('Starting timer');
    lastRecordedTimeRef.current = timeRemaining;
    const totalTime = getTotalTime(timerMode, settings);
    const elapsedSeconds = totalTime - timeRemaining;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    setIsRunning(true);
  };
  
  const handlePause = async () => {
    console.log('Pausing timer');
    setIsRunning(false);
    if (user && lastRecordedTimeRef.current && timerMode === 'work') {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    // No setTimeRemaining call here - this allows the timer to remain at its current value
  };
  
  const handleReset = async () => {
    console.log('Resetting timer');
    setIsRunning(false);
    if (user && lastRecordedTimeRef.current && timerMode === 'work') {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    setTimeRemaining(getTotalTime(timerMode, settings));
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
  };

  const handleModeChange = async (mode: TimerMode) => {
    console.log(`Changing mode to: ${mode}`);
    if (isRunning && user && lastRecordedTimeRef.current && timerMode === 'work') {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    
    setIsRunning(false);
    setTimerMode(mode);
    setTimeRemaining(getTotalTime(mode, settings));
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
  };

  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
