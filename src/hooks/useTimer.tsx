import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

export const useTimer = (initialSettings: TimerSettings) => {
  const { user } = useAuth();
  const { toast } = useToast();
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
    if (user) {
      fetchTodayStats();
    }
  }, [user]);

  const fetchTodayStats = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Get today's completed work sessions
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_type', 'work')
        .eq('completed', true)
        .gte('created_at', startOfDay.toISOString());
        
      if (error) throw error;
      
      // Calculate total time and completed sessions
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
              
              // Save completed session to Supabase if user is logged in
              if (user) {
                saveFocusSession(settings.workDuration * 60, true);
                updateDailyStats(settings.workDuration, true);
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
          
          // Show toast notification for completed work sessions
          if (completed && timerMode === 'work') {
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

  // Function to update daily stats in sessions_summary
  const updateDailyStats = async (durationMinutes: number, completed: boolean) => {
    try {
      if (!user || !completed) return;
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if there's already a summary for today
      const { data: existingData, error: queryError } = await supabase
        .from('sessions_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();
        
      if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw queryError;
      }
      
      // Get streak info
      const { data: recentDays, error: streakError } = await supabase
        .from('sessions_summary')
        .select('date')
        .eq('user_id', user.id)
        .eq('total_completed_sessions', '>', 0)
        .order('date', { ascending: false });
        
      if (streakError) throw streakError;
      
      // Calculate current streak
      let currentStreak = 0;
      if (recentDays && recentDays.length > 0) {
        const dates = recentDays.map(day => new Date(day.date).toISOString().split('T')[0]);
        
        // Check if today is in the list
        const todayIndex = dates.indexOf(today);
        if (todayIndex === -1) {
          // Today is not yet in the list, add it
          dates.unshift(today);
        }
        
        // Calculate streak
        currentStreak = 1; // Start with today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        for (let i = 1; i < dates.length; i++) {
          const currentDate = new Date(dates[i-1]);
          const prevDate = new Date(dates[i]);
          
          // Check if dates are consecutive
          const diffTime = currentDate.getTime() - prevDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        currentStreak = 1; // First day with sessions
      }
      
      if (existingData) {
        // Update existing summary
        const { error } = await supabase
          .from('sessions_summary')
          .update({
            total_sessions: existingData.total_sessions + 1,
            total_focus_time: existingData.total_focus_time + durationMinutes,
            total_completed_sessions: existingData.total_completed_sessions + (completed ? 1 : 0),
            longest_streak: Math.max(existingData.longest_streak, currentStreak),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        if (error) throw error;
      } else {
        // Create new summary for today
        const { error } = await supabase
          .from('sessions_summary')
          .insert({
            user_id: user.id,
            date: today,
            total_sessions: 1,
            total_focus_time: durationMinutes,
            total_completed_sessions: completed ? 1 : 0,
            longest_streak: currentStreak
          });
          
        if (error) throw error;
      }
      
      // Update productivity score for trends
      await updateProductivityScore(today);
      
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  };

  // Function to update productivity score
  const updateProductivityScore = async (date: string) => {
    try {
      if (!user) return;
      
      // Get today's focus sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_type', 'work')
        .like('created_at', `${date}%`);
        
      if (sessionsError) throw sessionsError;
      
      // Calculate productivity score based on number of completed sessions
      // and total duration
      const completedSessions = sessions.filter(s => s.completed).length;
      const totalDurationMinutes = sessions
        .filter(s => s.completed)
        .reduce((total, session) => total + (session.duration / 60), 0);
      
      // Simple formula: 10 points per session + 1 point per 3 minutes, max 100
      const score = Math.min(
        100,
        (completedSessions * 10) + Math.floor(totalDurationMinutes / 3)
      );
      
      // Check if there's already a trend entry for today
      const { data: existingTrend, error: trendError } = await supabase
        .from('productivity_trends')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();
        
      if (trendError && trendError.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw trendError;
      }
      
      if (existingTrend) {
        // Update existing trend
        await supabase
          .from('productivity_trends')
          .update({
            productivity_score: score
          })
          .eq('id', existingTrend.id);
      } else {
        // Create new trend
        await supabase
          .from('productivity_trends')
          .insert({
            user_id: user.id,
            date: date,
            productivity_score: score
          });
      }
      
      // If the user has completed several sessions, generate insights
      if (completedSessions >= 3) {
        await generateInsights(completedSessions, totalDurationMinutes);
      }
      
    } catch (error) {
      console.error('Error updating productivity score:', error);
    }
  };

  // Function to generate insights based on user's behavior
  const generateInsights = async (sessionsCount: number, durationMinutes: number) => {
    try {
      if (!user) return;
      
      // Check if we already created an insight today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data: existingInsights, error: insightError } = await supabase
        .from('insights')
        .select('created_at')
        .eq('user_id', user.id)
        .like('created_at', `${today}%`)
        .order('created_at', { ascending: false });
        
      if (insightError) throw insightError;
      
      // Only create a new insight if none exists for today
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
        
        // Save the insight
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
