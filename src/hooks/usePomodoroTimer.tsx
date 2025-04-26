
import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export function usePomodoroTimer(settings: TimerSettings) {
  // Core timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => settings.workDuration * 60);
  const [progress, setProgress] = useState(0); // Start at 0% (empty)
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // Timer interval reference
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current mode duration in seconds
  const getCurrentModeDuration = useCallback((): number => {
    switch (mode) {
      case 'work':
        return settings.workDuration * 60;
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  }, [mode, settings]);

  // Update timer when settings change but only if not running
  useEffect(() => {
    if (!isRunning) {
      const newTime = getCurrentModeDuration();
      setTimeLeft(newTime);
      setProgress(0); // Reset progress when settings change
      console.log(`Settings changed: Updated timer for ${mode} mode to ${newTime} seconds`);
    }
  }, [settings, mode, getCurrentModeDuration, isRunning]);

  // Timer tick effect
  useEffect(() => {
    // Always clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isRunning) {
      const startTime = Date.now();
      const initialTimeLeft = timeLeft;
      
      timerIntervalRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const newTimeLeft = Math.max(0, initialTimeLeft - elapsedSeconds);
        
        setTimeLeft(newTimeLeft);
        
        // Calculate progress percentage - increases as time passes
        const totalTime = getCurrentModeDuration();
        const newProgress = ((totalTime - newTimeLeft) / totalTime) * 100;
        setProgress(newProgress);
        
        if (newTimeLeft <= 0) {
          // Timer completed
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
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
        }
      }, 100); // Update more frequently for smoother progress
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning, getCurrentModeDuration, mode, currentSessionIndex, settings.sessionsUntilLongBreak, timeLeft]);

  // Timer control functions
  const start = useCallback(() => {
    console.log("Starting timer with mode:", mode, "and time left:", timeLeft);
    setIsRunning(true);
  }, [mode, timeLeft]);
  
  const pause = useCallback(() => {
    console.log("Pausing timer with time left:", timeLeft);
    setIsRunning(false);
  }, [timeLeft]);
  
  const reset = useCallback(() => {
    console.log("Resetting timer for mode:", mode);
    setIsRunning(false);
    const newTime = getCurrentModeDuration();
    setTimeLeft(newTime);
    setProgress(0); // Reset progress to 0% (empty)
  }, [getCurrentModeDuration, mode]);

  const handleModeChange = useCallback((newMode: TimerMode) => {
    // Stop the timer if it's running
    setIsRunning(false);
    
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
  }, [settings]);

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
