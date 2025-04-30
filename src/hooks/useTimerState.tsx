
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface TimerSettings {
  focus: number;
  break: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
}

export function useTimerState(initialSettings: TimerSettings) {
  const [settings, setSettings] = useState<TimerSettings>(initialSettings);
  const [mode, setMode] = useState<'focus' | 'break' | 'longBreak'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.focus * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  
  // Update timer when mode or settings change (but only if not running)
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'focus') {
        setTimeRemaining(settings.focus * 60);
      } else if (mode === 'break') {
        setTimeRemaining(settings.break * 60);
      } else {
        setTimeRemaining(settings.longBreak * 60);
      }
    }
  }, [mode, settings, isRunning]);

  // Handle timer completion - this function will be called when the timer reaches zero
  const handleTimerComplete = () => {
    console.log("Timer completed for mode:", mode);
    // Stop the timer
    setIsRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Play notification sound or show toast
    toast.success(`${mode.charAt(0).toUpperCase() + mode.slice(1)} session completed!`);
    
    // Handle session transition
    if (mode === 'focus') {
      // Increment completed sessions counter after focus session
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Check if it's time for a long break
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
      } else {
        setMode('break');
      }
      
      // Auto-start next session after a short delay
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
    } else {
      // After any break, return to focus mode
      setMode('focus');
      
      // Auto-start next focus session after a short delay
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
    }
  };

  return {
    settings,
    setSettings,
    mode,
    setMode,
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    completedSessions,
    setCompletedSessions,
    timerInterval,
    setTimerInterval,
    handleTimerComplete
  };
}
