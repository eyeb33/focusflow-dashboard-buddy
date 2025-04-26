
import { useState, useEffect, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export function usePomodoroTimer(settings: TimerSettings) {
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [progress, setProgress] = useState(100);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Get current mode duration
  const getCurrentModeDuration = useCallback(() => {
    switch (mode) {
      case 'work':
        return settings.workDuration * 60;
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [mode, settings]);

  // Handle mode changes
  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    
    // Set time based on the new mode using the correct property names
    switch (newMode) {
      case 'work':
        setTimeLeft(settings.workDuration * 60);
        break;
      case 'break':
        setTimeLeft(settings.breakDuration * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakDuration * 60);
        break;
    }
    
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
            // Calculate progress percentage based on remaining time
            const newProgress = (newTime / totalTime) * 100;
            setProgress(newProgress);
            return newTime;
          } else {
            // Timer completed
            clearInterval(interval);
            setIsRunning(false);
            
            // Auto switch modes
            if (mode === 'work') {
              const nextIndex = currentSessionIndex + 1;
              setCurrentSessionIndex(nextIndex);
              const shouldTakeLongBreak = nextIndex % settings.sessionsUntilLongBreak === 0;
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
  }, [isRunning, getCurrentModeDuration, mode, currentSessionIndex, handleModeChange, settings]);

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
