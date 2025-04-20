import { saveFocusSession } from './timerStorage';
import { updateDailyStats } from './productivityStats';
import { supabase } from '@/integrations/supabase/client';

export type TimerMode = 'work' | 'break' | 'longBreak';

export const getModeLabel = (mode: TimerMode): string => {
  switch (mode) {
    case 'work':
      return 'Focus';
    case 'break':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
    default:
      return 'Timer';
  }
};

export const getTotalTime = (mode: TimerMode, settings: any): number => {
  switch (mode) {
    case 'work':
      return settings.workDuration * 60;
    case 'break':
      return settings.breakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
    default:
      return 0;
  }
};

export const loadTodayStats = async (userId: string) => {
  try {
    const stats = await fetchTodayStatsFromDatabase(userId);
    return {
      completedSessions: stats.completedSessions,
      totalTimeToday: stats.totalTimeToday
    };
  } catch (error) {
    console.error("Error loading today's stats:", error);
    return { completedSessions: 0, totalTimeToday: 0 };
  }
};

const fetchTodayStatsFromDatabase = async (userId: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // First try to get today's summary from sessions_summary table
    const { data: summaryData, error: summaryError } = await supabase
      .from('sessions_summary')
      .select('total_completed_sessions, total_focus_time')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
      
    if (summaryData) {
      return {
        completedSessions: summaryData.total_completed_sessions || 0,
        totalTimeToday: summaryData.total_focus_time || 0
      };
    } else {
      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error fetching summary data:', summaryError);
      }
    }
    
    // If no summary exists, fall back to calculating from individual sessions
    const startOfDay = new Date(today);
    
    // Fetch all work sessions from today, both complete and partial
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .gte('created_at', startOfDay.toISOString());
      
    if (error) {
      console.error('Error fetching focus sessions:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return { completedSessions: 0, totalTimeToday: 0 };
    }
    
    // Count completed sessions
    const completedSessions = data.filter(session => session.completed).length;
    
    // Calculate total minutes from all work sessions (completed or partial)
    const totalMinutes = data.reduce((total, session) => {
      return total + Math.floor(session.duration / 60);
    }, 0);
    
    return {
      completedSessions,
      totalTimeToday: totalMinutes
    };
  } catch (error) {
    console.error('Error fetching today\'s stats:', error);
    return { completedSessions: 0, totalTimeToday: 0 };
  }
};

/**
 * Save a partial session when a user pauses a timer
 * @param userId The user ID
 * @param mode The timer mode
 * @param totalTime The total time in seconds for the session
 * @param remainingTime The remaining time in seconds
 * @param lastRecordedFullMinutes The last recorded full minutes for this session
 */
export const savePartialSession = async (
  userId: string, 
  mode: TimerMode, 
  totalTime: number, 
  remainingTime: number,
  lastRecordedFullMinutes: number
) => {
  try {
    if (!userId || mode !== 'work') return null;
    
    const elapsedTime = totalTime - remainingTime;
    const elapsedMinutes = Math.floor(elapsedTime / 60);
    
    // Don't record if less than a minute has passed since last recording
    if (elapsedMinutes <= lastRecordedFullMinutes) {
      return { success: false, message: 'Not enough time elapsed' };
    }
    
    // Calculate minutes elapsed since last recording
    const newMinutes = elapsedMinutes - lastRecordedFullMinutes;
    
    console.log(`Saving partial session: ${newMinutes} new minutes (elapsed ${elapsedMinutes} total)`);
    
    // Update daily stats with the new minutes only
    await updateDailyStats(
      userId, 
      newMinutes, // Only the new minutes since last recording
      mode
    );
    
    return { 
      success: true,
      message: `Added ${newMinutes} minutes to the session`,
      newFullMinutes: elapsedMinutes 
    };
  } catch (error) {
    console.error('Error saving partial session:', error);
    return null;
  }
};

export const enableRealtimeForSessionsSummary = () => {
  supabase
    .channel('sessions_summary')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sessions_summary' },
      (payload) => {
        console.log('Sessions Summary Change received!', payload);
      }
    )
    .subscribe();
};
