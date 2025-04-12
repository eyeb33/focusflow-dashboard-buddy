
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveFocusSession, fetchTodayStats } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';
import { formatTime, getModeLabel } from '@/utils/timerUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface TimerContextType {
  timerMode: 'work' | 'break' | 'longBreak';
  isRunning: boolean;
  timeRemaining: number;
  completedSessions: number;
  totalTimeToday: number;
  settings: TimerSettings;
  progress: number;
  formatTime: (seconds: number) => string;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: () => void;
  handleSkip: () => void;
  handleModeChange: (mode: 'work' | 'break' | 'longBreak') => void;
  getModeLabel: () => string;
  updateSettings: (newSettings: Partial<TimerSettings>) => void;
}

const defaultSettings: TimerSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timerMode, setTimerMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(defaultSettings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecordedTimeRef = useRef<number | null>(null);
  
  const [settings, setSettings] = useState<TimerSettings>(defaultSettings);

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
    lastRecordedTimeRef.current = getTotalTime();
  }, [timerMode, settings.workDuration, settings.breakDuration, settings.longBreakDuration]);

  useEffect(() => {
    if (user) {
      loadTodayStats();
    }
  }, [user]);

  const loadTodayStats = async () => {
    if (!user) return;
    
    const stats = await fetchTodayStats(user.id);
    setCompletedSessions(stats.completedSessions);
    setTotalTimeToday(stats.totalTimeToday);
  };

  // Function to save partial focus time
  const savePartialSessionTime = async () => {
    if (!user || !lastRecordedTimeRef.current) return;
    
    const totalTime = getTotalTime();
    const elapsedTime = totalTime - timeRemaining;
    
    // Only save if there's meaningful elapsed time (more than 1 second)
    if (elapsedTime > 1) {
      console.log(`Saving partial session: ${elapsedTime} seconds`);
      
      // Record progress in Supabase - partial session (completed = false)
      await saveFocusSession(user.id, timerMode, elapsedTime, false);
      
      // Only update daily stats for work sessions
      if (timerMode === 'work') {
        const elapsedMinutes = Math.floor(elapsedTime / 60);
        if (elapsedMinutes > 0) {
          await updateDailyStats(user.id, elapsedMinutes);
          setTotalTimeToday(prev => prev + elapsedMinutes);
        }
      }
      
      // Reset the reference time
      lastRecordedTimeRef.current = timeRemaining;
    }
  };

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
              
              if (user) {
                saveFocusSession(user.id, timerMode, settings.workDuration * 60);
                updateDailyStats(user.id, settings.workDuration);
              }
              
              if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
                setTimerMode('longBreak');
              } else {
                setTimerMode('break');
              }
            } else {
              if (user) {
                const duration = timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
                const durationMinutes = timerMode === 'break' ? settings.breakDuration : settings.longBreakDuration;
                saveFocusSession(user.id, timerMode, duration);
                updateDailyStats(user.id, durationMinutes);
              }
              
              setTimerMode('work');
            }
            
            lastRecordedTimeRef.current = null;
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

  const handleTimerCompleted = () => {
    if (timerMode === 'work' && user) {
      toast({
        title: "Session completed!",
        description: `You completed a ${settings.workDuration} minute focus session.`,
      });
    }
  };

  const handleStart = () => {
    lastRecordedTimeRef.current = timeRemaining;
    setIsRunning(true);
  };
  
  const handlePause = () => {
    setIsRunning(false);
    savePartialSessionTime();
  };
  
  const handleReset = () => {
    setIsRunning(false);
    savePartialSessionTime();
    setTimeRemaining(getTotalTime());
    lastRecordedTimeRef.current = getTotalTime();
  };
  
  const handleSkip = () => {
    setIsRunning(false);
    savePartialSessionTime();
    
    if (timerMode === 'work') {
      setTimerMode(completedSessions % settings.sessionsUntilLongBreak === settings.sessionsUntilLongBreak - 1 ? 'longBreak' : 'break');
    } else {
      setTimerMode('work');
    }
    
    lastRecordedTimeRef.current = null;
  };
  
  const handleModeChange = (mode: 'work' | 'break' | 'longBreak') => {
    if (isRunning) {
      savePartialSessionTime();
    }
    
    setIsRunning(false);
    setTimerMode(mode);
    lastRecordedTimeRef.current = null;
  };

  const getTimerModeLabel = () => getModeLabel(timerMode);

  const updateSettings = (newSettings: Partial<TimerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const progress = 1 - (timeRemaining / getTotalTime());

  return (
    <TimerContext.Provider
      value={{
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
        getModeLabel: getTimerModeLabel,
        updateSettings
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  
  return context;
};
