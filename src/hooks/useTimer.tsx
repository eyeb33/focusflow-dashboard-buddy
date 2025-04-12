
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export const useTimer = (initialSettings: TimerSettings) => {
  const { user } = useAuth();
  const [timerMode, setTimerMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialSettings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [settings, setSettings] = useState<TimerSettings>(initialSettings);

  const getTotalTime = () => {
    switch (timerMode) {
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      case 'work':
      default:
        return settings.workDuration * 60;
    }
  };

  useEffect(() => {
    setTimeRemaining(getTotalTime());
  }, [timerMode, settings.workDuration, settings.breakDuration, settings.longBreakDuration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            
            if (timerMode === 'work') {
              const newCompletedSessions = completedSessions + 1;
              setCompletedSessions(newCompletedSessions);
              setTotalTimeToday(prev => prev + settings.workDuration);
              
              // Save completed session to Supabase if user is logged in
              if (user) {
                saveFocusSession(settings.workDuration * 60, true);
              }
              
              if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
                setTimerMode('longBreak');
              } else {
                setTimerMode('break');
              }
            } else {
              // Save break session to Supabase if user is logged in
              if (user) {
                saveFocusSession(
                  timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60, 
                  true
                );
              }
              
              setTimerMode('work');
            }
            
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerMode, user, settings, completedSessions]);

  // Function to save a focus session to Supabase
  const saveFocusSession = async (duration: number, completed: boolean) => {
    try {
      if (user) {
        const { error } = await supabase.from('focus_sessions').insert({
          user_id: user.id,
          session_type: timerMode,
          duration: duration,
          completed: completed
        });
        
        if (error) {
          console.error('Error saving session:', error);
        } else {
          console.log('Session saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(getTotalTime());
  };
  
  const handleSkip = () => {
    setIsRunning(false);
    if (timerMode === 'work') {
      // Save skipped work session
      if (user) {
        const elapsedTime = getTotalTime() - timeRemaining;
        if (elapsedTime > 0) {
          saveFocusSession(elapsedTime, false);
        }
      }
      setTimerMode(completedSessions % settings.sessionsUntilLongBreak === settings.sessionsUntilLongBreak - 1 ? 'longBreak' : 'break');
    } else {
      // Save skipped break session
      if (user) {
        const elapsedTime = getTotalTime() - timeRemaining;
        if (elapsedTime > 0) {
          saveFocusSession(elapsedTime, false);
        }
      }
      setTimerMode('work');
    }
  };
  
  const handleModeChange = (mode: 'work' | 'break' | 'longBreak') => {
    // Save the current session if it was in progress
    if (isRunning && user) {
      const elapsedTime = getTotalTime() - timeRemaining;
      if (elapsedTime > 0) {
        saveFocusSession(elapsedTime, false);
      }
    }
    setIsRunning(false);
    setTimerMode(mode);
  };
  
  const getModeLabel = () => {
    switch (timerMode) {
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      case 'work':
      default:
        return 'Focus';
    }
  };

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const progress = 1 - (timeRemaining / getTotalTime());

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    settings,
    progress,
    formatTime,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    handleModeChange,
    getModeLabel,
    updateSettings
  };
};
