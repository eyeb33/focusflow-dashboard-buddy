
import { useState, useEffect, useRef } from 'react';

interface TimerSettings {
  focus: number;
  break: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
}

export function useTimerState(initialSettings: TimerSettings) {
  const [settings, setSettings] = useState(initialSettings);
  const [mode, setMode] = useState<'focus' | 'break' | 'longBreak'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(settings.focus * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  
  // Update timer when mode or settings change (but only if not running)
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'focus') {
        setRemainingTime(settings.focus * 60);
      } else if (mode === 'break') {
        setRemainingTime(settings.break * 60);
      } else {
        setRemainingTime(settings.longBreak * 60);
      }
    }
  }, [mode, settings, isRunning]);

  // Handle timer tick
  useEffect(() => {
    if (isRunning) {
      const interval = window.setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      setTimerInterval(interval as unknown as number);
      
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Handle session transition
    if (mode === 'focus') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Check if it's time for a long break
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
      } else {
        setMode('break');
      }
    } else {
      // After any break, return to focus mode
      setMode('focus');
    }
  };

  return {
    settings,
    setSettings,
    mode,
    setMode,
    isRunning,
    setIsRunning,
    remainingTime,
    setRemainingTime,
    completedSessions,
    timerInterval,
    setTimerInterval,
    handleTimerComplete
  };
}
