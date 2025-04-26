
import { useState, useEffect, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workTime: number;
  breakTime: number;
  longBreakTime: number;
}

export function usePomodoroTimer(settings: TimerSettings) {
  const [timeLeft, setTimeLeft] = useState(settings.workTime);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [progress, setProgress] = useState(100);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Get current mode duration
  const getCurrentModeDuration = useCallback(() => {
    switch (mode) {
      case 'work':
        return settings.workTime;
      case 'break':
        return settings.breakTime;
      case 'longBreak':
        return settings.longBreakTime;
    }
  }, [mode, settings]);

  // Handle mode changes
  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(settings[`${newMode}Time`]);
    setProgress(100);
    setIsRunning(false);
  }, [settings]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime > 0) {
            const newTime = prevTime - 1;
            const totalTime = getCurrentModeDuration();
            setProgress((newTime / totalTime) * 100);
            return newTime;
          } else {
            // Timer completed
            clearInterval(interval);
            setIsRunning(false);
            
            // Auto switch modes
            if (mode === 'work') {
              const nextIndex = currentSessionIndex + 1;
              setCurrentSessionIndex(nextIndex);
              const shouldTakeLongBreak = nextIndex % 4 === 0;
              handleModeChange(shouldTakeLongBreak ? 'longBreak' : 'break');
            } else {
              handleModeChange('work');
            }
            return 0;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, getCurrentModeDuration, mode, currentSessionIndex, handleModeChange]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(getCurrentModeDuration());
    setProgress(100);
  }, [getCurrentModeDuration]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }, []);

  const getModeLabel = useCallback(() => {
    switch (mode) {
      case 'work':
        return 'Focus Time';
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  }, [mode]);

  return {
    timeLeft,
    isRunning,
    mode,
    progress,
    currentSessionIndex,
    start,
    pause,
    reset,
    handleModeChange,
    formatTime,
    getModeLabel
  };
}
