
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  }, [timerMode, settings.workDuration, settings.breakDuration, settings.longBreakDuration]);

  useEffect(() => {
    if (user) {
      fetchTodayStats();
    }
  }, [user]);

  const fetchTodayStats = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_type', 'work')
        .eq('completed', true)
        .gte('created_at', startOfDay.toISOString());
        
      if (error) throw error;
      
      const totalMinutes = data.reduce((total, session) => {
        return total + Math.floor(session.duration / 60);
      }, 0);
      
      setCompletedSessions(data.length);
      setTotalTimeToday(totalMinutes);
    } catch (error) {
      console.error('Error fetching today\'s stats:', error);
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
                saveFocusSession(settings.workDuration * 60);
                updateDailyStats(settings.workDuration);
              }
              
              if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
                setTimerMode('longBreak');
              } else {
                setTimerMode('break');
              }
            } else {
              if (user) {
                saveFocusSession(
                  timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60
                );
                updateDailyStats(
                  timerMode === 'break' ? settings.breakDuration : settings.longBreakDuration
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

  const saveFocusSession = async (duration: number) => {
    try {
      if (user) {
        const { error } = await supabase.from('focus_sessions').insert({
          user_id: user.id,
          session_type: timerMode,
          duration: duration,
          completed: true
        });
        
        if (error) {
          console.error('Error saving session:', error);
        } else {
          console.log('Session saved successfully');
          
          if (timerMode === 'work') {
            toast({
              title: "Session completed!",
              description: `You completed a ${Math.floor(duration / 60)} minute focus session.`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  // Fix: Remove the third argument here as it's not needed
  const updateDailyStats = async (durationMinutes: number) => {
    try {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data: existingData, error: queryError } = await supabase
        .from('sessions_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
        
      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw queryError;
      }
      
      const { data: recentDays, error: streakError } = await supabase
        .from('sessions_summary')
        .select('date')
        .eq('user_id', user.id)
        .eq('total_completed_sessions', '>', 0)
        .order('date', { ascending: false });
        
      if (streakError) throw streakError;
      
      let currentStreak = 0;
      if (recentDays && recentDays.length > 0) {
        const dates = recentDays.map(day => new Date(day.date).toISOString().split('T')[0]);
        
        const todayIndex = dates.indexOf(today);
        if (todayIndex === -1) {
          dates.unshift(today);
        }
        
        currentStreak = 1;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        for (let i = 1; i < dates.length; i++) {
          const currentDate = new Date(dates[i-1]);
          const prevDate = new Date(dates[i]);
          
          const diffTime = currentDate.getTime() - prevDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        currentStreak = 1;
      }
      
      if (existingData) {
        const { error } = await supabase
          .from('sessions_summary')
          .update({
            total_sessions: existingData.total_sessions + 1,
            total_focus_time: existingData.total_focus_time + durationMinutes,
            total_completed_sessions: existingData.total_completed_sessions + 1,
            longest_streak: Math.max(existingData.longest_streak, currentStreak),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sessions_summary')
          .insert({
            user_id: user.id,
            date: today,
            total_sessions: 1,
            total_focus_time: durationMinutes,
            total_completed_sessions: 1,
            longest_streak: currentStreak
          });
          
        if (error) throw error;
      }
      
      await updateProductivityScore(today);
      
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  };

  const updateProductivityScore = async (date: string) => {
    try {
      if (!user) return;
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_type', 'work')
        .like('created_at', `${date}%`);
        
      if (sessionsError) throw sessionsError;
      
      const completedSessions = sessions.filter(s => s.completed).length;
      const totalDurationMinutes = sessions
        .filter(s => s.completed)
        .reduce((total, session) => total + (session.duration / 60), 0);
      
      const score = Math.min(
        100,
        (completedSessions * 10) + Math.floor(totalDurationMinutes / 3)
      );
      
      const { data: existingTrend, error: trendError } = await supabase
        .from('productivity_trends')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();
        
      if (trendError && trendError.code !== 'PGRST116') {
        throw trendError;
      }
      
      if (existingTrend) {
        await supabase
          .from('productivity_trends')
          .update({
            productivity_score: score
          })
          .eq('id', existingTrend.id);
      } else {
        await supabase
          .from('productivity_trends')
          .insert({
            user_id: user.id,
            date: date,
            productivity_score: score
          });
      }
      
      if (completedSessions >= 3) {
        await generateInsights(completedSessions, totalDurationMinutes);
      }
      
    } catch (error) {
      console.error('Error updating productivity score:', error);
    }
  };

  const generateInsights = async (sessionsCount: number, durationMinutes: number) => {
    try {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingInsights, error: insightError } = await supabase
        .from('insights')
        .select('created_at')
        .eq('user_id', user.id)
        .like('created_at', `${today}%`)
        .order('created_at', { ascending: false });
        
      if (insightError) throw insightError;
      
      if (existingInsights && existingInsights.length === 0) {
        let title = '';
        let content = '';
        
        if (sessionsCount >= 8) {
          title = 'Productive Day!';
          content = `You've completed ${sessionsCount} focus sessions today for a total of ${Math.round(durationMinutes)} minutes. That's impressive dedication!`;
        } else if (sessionsCount >= 5) {
          title = 'Great Progress Today';
          content = `With ${sessionsCount} completed sessions, you're making excellent progress. Keep it up!`;
        } else {
          title = 'Building Momentum';
          content = `You've completed ${sessionsCount} focus sessions today. Each session helps build your productivity habits.`;
        }
        
        await supabase
          .from('insights')
          .insert({
            user_id: user.id,
            title: title,
            content: content
          });
      }
    } catch (error) {
      console.error('Error generating insights:', error);
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
      if (user) {
        const elapsedTime = getTotalTime() - timeRemaining;
        if (elapsedTime > 0) {
          saveFocusSession(elapsedTime);
        }
      }
      setTimerMode(completedSessions % settings.sessionsUntilLongBreak === settings.sessionsUntilLongBreak - 1 ? 'longBreak' : 'break');
    } else {
      if (user) {
        const elapsedTime = getTotalTime() - timeRemaining;
        if (elapsedTime > 0) {
          saveFocusSession(elapsedTime);
        }
      }
      setTimerMode('work');
    }
  };
  
  const handleModeChange = (mode: 'work' | 'break' | 'longBreak') => {
    if (isRunning && user) {
      const elapsedTime = getTotalTime() - timeRemaining;
      if (elapsedTime > 0) {
        saveFocusSession(elapsedTime);
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
        getModeLabel,
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
