
import { useState, useEffect, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export function usePomodoroTimer(settings: TimerSettings) {
  // Initialize time based on current mode (work by default)
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(() => settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0); // Start at 0% (empty)
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

  // Update timer when settings change
  useEffect(() => {
    if (!isRunning) {
      // Only update the time if the timer isn't running
      const newTime = getCurrentModeDuration();
      setTimeLeft(newTime);
      // Reset progress when settings change
      setProgress(0);
      console.log(`Settings changed: Updated timer for ${mode} mode to ${newTime} seconds`);
    }
  }, [settings, mode, getCurrentModeDuration, isRunning]);

  // Handle mode changes
  const handleModeChange = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    
    // Set time based on the new mode
    const newTime = (() => {
      switch (newMode) {
        case 'work':
          return settings.workDuration * 60;
        case 'break':
          return settings.breakDuration * 60;
        case 'longBreak':
          return settings.longBreakDuration * 60;
      }
    })();
    
    setTimeLeft(newTime);
    setProgress(0); // Reset progress to 0% (empty)
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
            // Calculate progress percentage - increases as time passes
            const newProgress = ((totalTime - newTime) / totalTime) * 100;
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
    setProgress(0); // Reset progress to 0% (empty)
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
