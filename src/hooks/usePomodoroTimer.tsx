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
  const lastTickTimeRef = useRef<number>(0);

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
      // Save the start time of this timer run
      if (lastTickTimeRef.current === 0) {
        lastTickTimeRef.current = Date.now();
      }
      
      timerIntervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - lastTickTimeRef.current) / 1000);
        
        if (elapsedSeconds >= 1) {
          setTimeLeft(prevTime => {
            const newTimeLeft = Math.max(0, prevTime - elapsedSeconds);
            
            // Calculate progress percentage - increases as time passes
            const totalTime = getCurrentModeDuration();
            const newProgress = ((totalTime - newTimeLeft) / totalTime) * 100;
            setProgress(newProgress);
            
            // Update the last tick time
            lastTickTimeRef.current = currentTime;
            
            if (newTimeLeft <= 0) {
              // Timer completed
              clearInterval(timerIntervalRef.current!);
              timerIntervalRef.current = null;
              setIsRunning(false);
              lastTickTimeRef.current = 0;
              
              // Auto switch modes
              if (mode === 'work') {
                const nextIndex = currentSessionIndex + 1;
                setCurrentSessionIndex(nextIndex);
                const shouldTakeLongBreak = nextIndex % settings.sessionsUntilLongBreak === 0 && nextIndex > 0;
                handleModeChange(shouldTakeLongBreak ? 'longBreak' : 'break');
              } else {
                handleModeChange('work');
              }
            }
            
            return newTimeLeft;
          });
        }
      }, 100); // Update more frequently for smoother progress
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isRunning, getCurrentModeDuration, mode, currentSessionIndex, settings.sessionsUntilLongBreak]);

  // Timer control functions
  const start = useCallback(() => {
    console.log("Starting timer with mode:", mode, "and time left:", timeLeft);
    setIsRunning(true);
  }, [mode, timeLeft]);
  
  const pause = useCallback(() => {
    console.log("Pausing timer with time left:", timeLeft);
    setIsRunning(false);
    // Reset the tick reference but keep timeLeft as is
    lastTickTimeRef.current = 0;
  }, [timeLeft]);
  
  const reset = useCallback(() => {
    console.log("Resetting timer for mode:", mode);
    setIsRunning(false);
    const newTime = getCurrentModeDuration();
    setTimeLeft(newTime);
    setProgress(0); // Reset progress to 0% (empty)
    lastTickTimeRef.current = 0;
  }, [getCurrentModeDuration, mode]);

  const handleModeChange = useCallback((newMode: TimerMode) => {
    // Stop the timer if it's running
    setIsRunning(false);
    
    setMode(newMode);
    
    // Reset tick reference
    lastTickTimeRef.current = 0;
    
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
