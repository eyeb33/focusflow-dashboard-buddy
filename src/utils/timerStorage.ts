
import { supabase } from '@/integrations/supabase/client';

export interface FocusSession {
  user_id: string;
  session_type: 'work' | 'break' | 'longBreak';
  duration: number;  // Always stored in seconds in the database
  completed: boolean;
}

export const saveFocusSession = async (userId: string, sessionType: 'work' | 'break' | 'longBreak', duration: number, completed: boolean = true) => {
  try {
    if (!userId) return;
    
    const { error } = await supabase.from('focus_sessions').insert({
      user_id: userId,
      session_type: sessionType,
      duration: duration,  // Already in seconds
      completed: completed
    });
    
    if (error) {
      console.error('Error saving session:', error);
      return false;
    } 
    
    console.log('Session saved successfully', { sessionType, duration, completed });
    return true;
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
      return {
        completedSessions: summaryData.total_completed_sessions || 0,
        totalTimeToday: summaryData.total_focus_time || 0  // Already in minutes in the summary table
      };
    } else {
      console.log('No summary data found for today, calculating from focus_sessions');
      
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
      console.log('No focus sessions found for today');
      return { completedSessions: 0, totalTimeToday: 0 };
    }
    
    // Count completed sessions
    const completedSessions = data.filter(session => session.completed).length;
    
    // Calculate total minutes from all work sessions (completed or partial)
    // Convert from seconds to minutes
    const totalMinutes = data.reduce((total, session) => {
      return total + Math.floor(session.duration / 60);
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
