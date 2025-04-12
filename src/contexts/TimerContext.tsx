
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
  const lastRecordedFullMinutesRef = useRef<number>(0);
  
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
    lastRecordedFullMinutesRef.current = 0;
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

  // Function to save partial focus time - only counting complete minutes
  const savePartialSessionTime = async () => {
    if (!user || !lastRecordedTimeRef.current) return;
    
    const totalTime = getTotalTime();
    const elapsedTime = totalTime - timeRemaining;
    const elapsedFullMinutes = Math.floor(elapsedTime / 60);
    const newFullMinutes = elapsedFullMinutes - lastRecordedFullMinutesRef.current;
    
    // Only save if there are new full minutes completed
    if (newFullMinutes > 0) {
      console.log(`Saving partial session with ${newFullMinutes} new complete minutes`);
      
      // Save the completed minutes (in seconds) to the database
      await saveFocusSession(user.id, timerMode, newFullMinutes * 60, false);
      
      // Only update daily stats for work sessions
      if (timerMode === 'work') {
        await updateDailyStats(user.id, newFullMinutes);
        setTotalTimeToday(prev => prev + newFullMinutes);
      }
      
      // Update the reference for completed minutes
      lastRecordedFullMinutesRef.current = elapsedFullMinutes;
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
            lastRecordedFullMinutesRef.current = 0;
            setIsRunning(false);
            return 0;
          }
          
          // Check if we've completed another full minute
          const newTime = prevTime - 1;
          const totalTime = getTotalTime();
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = Math.floor((totalTime - prevTime) / 60);
          
          // If we've completed a new full minute and user is logged in
          if (user && newFullMinutes > prevFullMinutes) {
            console.log(`Completed a new minute: ${newFullMinutes} minutes`);
            
            // Only for work sessions
            if (timerMode === 'work') {
              // Save the single minute progress
              savePartialSessionTime();
            }
          }
          
          return newTime;
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
    // When starting, record the current completed full minutes
    const totalTime = getTotalTime();
    const elapsedSeconds = totalTime - timeRemaining;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
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
    lastRecordedFullMinutesRef.current = 0;
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
    lastRecordedFullMinutesRef.current = 0;
  };
  
  const handleModeChange = (mode: 'work' | 'break' | 'longBreak') => {
    if (isRunning) {
      savePartialSessionTime();
    }
    
    setIsRunning(false);
    setTimerMode(mode);
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
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
