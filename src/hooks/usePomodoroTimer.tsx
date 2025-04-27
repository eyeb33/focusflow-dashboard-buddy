
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
  const [initialTime, setInitialTime] = useState(() => settings.workDuration * 60);
  const [progress, setProgress] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // Timer interval reference for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  // Calculate timer duration based on current mode
  const getDurationForMode = useCallback((timerMode: TimerMode): number => {
    switch (timerMode) {
      case 'work':
        return settings.workDuration * 60;
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  }, [settings]);

  // Update timer when settings or mode changes (but only when not running)
  useEffect(() => {
    if (!isRunning) {
      const newTime = getDurationForMode(mode);
      setInitialTime(newTime);
      setTimeLeft(newTime);
      // Calculate progress (0% when timer is reset)
      setProgress(0);
      console.log(`Mode or settings changed: Updated timer for ${mode} mode to ${newTime} seconds`);
    }
  }, [settings, mode, getDurationForMode, isRunning]);

  // Timer tick effect
  useEffect(() => {
    // Always clean up any existing interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isRunning) {
      console.log(`Starting timer countdown with ${timeLeft} seconds remaining`);
      lastTickTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - lastTickTimeRef.current) / 1000);
        
        if (elapsedSeconds >= 1) {
          setTimeLeft(prevTime => {
            const newTimeLeft = Math.max(0, prevTime - elapsedSeconds);
            
            // Calculate progress percentage (increases as time passes)
            const newProgress = ((initialTime - newTimeLeft) / initialTime) * 100;
            setProgress(newProgress);
            
            // Update the last tick time
            lastTickTimeRef.current = currentTime;
            
            if (newTimeLeft <= 0) {
              // Timer completed
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setIsRunning(false);
              
              // Auto switch modes and handle session completion
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

    // Cleanup on component unmount or when isRunning changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, mode, initialTime, currentSessionIndex, settings.sessionsUntilLongBreak, timeLeft]);

  // Timer control functions
  const start = useCallback(() => {
    console.log("Starting timer with mode:", mode, "and time left:", timeLeft);
    setIsRunning(true);
    lastTickTimeRef.current = Date.now();
  }, [mode, timeLeft]);
  
  const pause = useCallback(() => {
    console.log("Pausing timer with time left:", timeLeft);
    setIsRunning(false);
  }, [timeLeft]);
  
  const reset = useCallback(() => {
    console.log("Resetting timer for mode:", mode);
    setIsRunning(false);
    const newTime = getDurationForMode(mode);
    setTimeLeft(newTime);
    setProgress(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [getDurationForMode, mode]);

  const handleModeChange = useCallback((newMode: TimerMode) => {
    // Stop the timer if it's running
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Update mode
    setMode(newMode);
    
    // Set time based on the new mode
    const newTime = getDurationForMode(newMode);
    setInitialTime(newTime);
    setTimeLeft(newTime);
    setProgress(0);
    
    console.log(`Changed mode to ${newMode} with duration: ${newTime} seconds`);
  }, [getDurationForMode]);

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
    initialTime,
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
