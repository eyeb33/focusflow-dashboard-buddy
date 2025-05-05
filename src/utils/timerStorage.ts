
import { supabase } from '@/integrations/supabase/client';
import { updateDailyStats } from './productivityStats';

export interface FocusSession {
  user_id: string;
  session_type: 'work' | 'break' | 'longBreak';
  duration: number;  // Always stored in seconds in the database
  completed: boolean;
  start_time?: string; // Track when the session was started
}

export const saveFocusSession = async (
  userId: string, 
  sessionType: 'work' | 'break' | 'longBreak', 
  duration: number, 
  completed: boolean = true,
  startTime?: string // Optional parameter for start time
) => {
  try {
    if (!userId) {
      console.error('Cannot save session: No user ID provided');
      return false;
    }
    
    // Use provided start time or current timestamp
    const sessionStartTime = startTime || new Date().toISOString();
    const sessionDate = sessionStartTime.split('T')[0]; // YYYY-MM-DD
    
    console.log(`Saving ${sessionType} session to Supabase:`, {
      userId,
      sessionType,
      duration,
      completed,
      created_at: sessionStartTime
    });
    
    // For work sessions, ensure duration is reasonable
    // Standard pomodoro is 25 minutes (1500 seconds)
    if (sessionType === 'work' && completed) {
      // Add a sanity check - cap at 60 minutes (3600 seconds) as maximum
      const normalizedDuration = Math.min(duration, 3600);
      
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        session_type: sessionType,
        duration: normalizedDuration,
        completed: completed,
        created_at: sessionStartTime // Use the start time for attribution purposes
      });
      
      if (error) {
        console.error('Error saving session to Supabase:', error);
        return false;
      } 
      
      console.log('Session saved successfully to Supabase', { 
        sessionType, 
        normalizedDuration, 
        completed, 
        created_at: sessionStartTime 
      });
      
      // Also update the daily stats for work sessions
      if (completed) {
        // Convert seconds to minutes for stats
        const durationMinutes = Math.floor(normalizedDuration / 60);
        console.log(`Updating daily stats with ${durationMinutes} minutes`);
        await updateDailyStats(userId, durationMinutes, 'work', sessionDate);
      }
      
      return true;
    } else {
      // For non-work sessions or incomplete sessions, save as-is
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        session_type: sessionType,
        duration: duration,
        completed: completed,
        created_at: sessionStartTime // Use the start time for attribution purposes
      });
      
      if (error) {
        console.error('Error saving session to Supabase:', error);
        return false;
      }
      
      console.log('Non-work session saved successfully to Supabase', { 
        sessionType, duration, completed, created_at: sessionStartTime 
      });
      return true;
    }
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
};

export const fetchTodayStats = async (userId: string | undefined) => {
  if (!userId) return { completedSessions: 0, totalTimeToday: 0 };
  
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('Fetching stats for today:', today);
    
    // First try to get today's summary from sessions_summary table
    const { data: summaryData, error: summaryError } = await supabase
      .from('sessions_summary')
      .select('total_completed_sessions, total_focus_time')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
      
    if (summaryData) {
      console.log('Found summary data for today:', summaryData);
      
      // Apply a sanity check on the values - cap minutes based on sessions
      // Assuming max 60 minutes per session as a reasonable upper bound
      const sessions = summaryData.total_completed_sessions || 0;
      let minutes = summaryData.total_focus_time || 0;
      const maxReasonableMinutes = sessions * 60;
      
      // If minutes are unreasonably high, cap them
      if (sessions > 0 && minutes > maxReasonableMinutes) {
        console.warn(`Detected unreasonable focus time: ${minutes} minutes for ${sessions} sessions. Capping to ${maxReasonableMinutes}`);
        minutes = maxReasonableMinutes;
      }
      
      return {
        completedSessions: sessions,
        totalTimeToday: minutes
      };
    } else {
      console.log('No summary data found for today, calculating from focus_sessions');
      
      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error fetching summary data:', summaryError);
      }
    }
    
    // If no summary exists, fall back to calculating from individual sessions
    const startOfDay = new Date(today);
    
    // Fetch only completed work sessions from today
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', startOfDay.toISOString());
      
    if (error) {
      console.error('Error fetching focus sessions:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No focus sessions found for today');
      return { completedSessions: 0, totalTimeToday: 0 };
    }
    
    // Count completed sessions
    const completedSessions = data.length;
    
    // Calculate total minutes from work sessions
    const totalMinutes = data.reduce((total, session) => {
      // Convert seconds to minutes (rounded down) and limit to 60 minutes per session
      const sessionMinutes = Math.min(Math.floor(session.duration / 60), 60);
      return total + sessionMinutes;
    }, 0);
    
    console.log('Calculated from sessions:', { completedSessions, totalMinutes });
    
    return {
      completedSessions,
      totalTimeToday: totalMinutes
    };
  } catch (error) {
    console.error('Error fetching today\'s stats:', error);
    return { completedSessions: 0, totalTimeToday: 0 };
  }
};
