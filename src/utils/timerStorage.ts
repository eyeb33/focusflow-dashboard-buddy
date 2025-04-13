import { supabase } from '@/integrations/supabase/client';

export interface FocusSession {
  user_id: string;
  session_type: 'work' | 'break' | 'longBreak';
  duration: number;
  completed: boolean;
}

export const saveFocusSession = async (userId: string, sessionType: 'work' | 'break' | 'longBreak', duration: number, completed: boolean = true) => {
  try {
    if (!userId) {
      console.error('Cannot save focus session: No user ID provided');
      return false;
    }
    
    console.log(`Saving focus session: userId=${userId}, type=${sessionType}, duration=${duration}s, completed=${completed}`);
    
    const { data, error } = await supabase.from('focus_sessions').insert({
      user_id: userId,
      session_type: sessionType,
      duration: duration,
      completed: completed
    }).select();
    
    if (error) {
      console.error('Error saving session to database:', error);
      return false;
    } 
    
    console.log('Session saved successfully to database:', data);
    return true;
  } catch (error) {
    console.error('Exception during session save:', error);
    return false;
  }
};

export const fetchTodayStats = async (userId: string | undefined) => {
  if (!userId) {
    console.log('Cannot fetch today stats: No user ID provided');
    return { completedSessions: 0, totalTimeToday: 0 };
  }
  
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`Fetching stats for today (${today}) for user ${userId}`);
    
    // First try to get today's summary from sessions_summary table
    const { data: summaryData, error: summaryError } = await supabase
      .from('sessions_summary')
      .select('total_completed_sessions, total_focus_time')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
      
    if (summaryData) {
      console.log('Found summary data for today:', summaryData);
      return {
        completedSessions: summaryData.total_completed_sessions || 0,
        totalTimeToday: summaryData.total_focus_time || 0
      };
    } else {
      console.log('No summary data found for today, calculating from focus_sessions');
      
      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error fetching summary data:', summaryError);
      }
    }
    
    // If no summary exists, fall back to calculating from individual sessions
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    // Fetch all work sessions from today, both complete and partial
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .eq('session_type', 'work');
      
    if (error) {
      console.error('Error fetching focus sessions:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No focus sessions found for today');
      return { completedSessions: 0, totalTimeToday: 0 };
    }
    
    // Count completed sessions
    const completedSessions = data.filter(session => 
      session.completed && session.session_type === 'work'
    ).length;
    
    // Calculate total minutes from all work sessions (completed or partial)
    const totalMinutes = data
      .filter(session => session.session_type === 'work')
      .reduce((total, session) => {
        return total + Math.floor(session.duration / 60);
      }, 0);
    
    console.log(`Calculated from sessions: ${completedSessions} completed sessions, ${totalMinutes} total minutes`);
    
    return {
      completedSessions,
      totalTimeToday: totalMinutes
    };
  } catch (error) {
    console.error('Error fetching today\'s stats:', error);
    return { completedSessions: 0, totalTimeToday: 0 };
  }
};

export const fetchYesterdayStats = async (userId: string | undefined) => {
  if (!userId) {
    console.log('Cannot fetch yesterday stats: No user ID provided');
    return { completedSessions: 0 };
  }
  
  try {
    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`Fetching stats for yesterday (${yesterdayStr}) for user ${userId}`);
    
    // Use the database function we created for this purpose
    const { data, error } = await supabase.rpc(
      'get_daily_completed_sessions',
      { 
        user_id_param: userId, 
        date_param: yesterdayStr 
      }
    );
      
    if (error) {
      console.error('Error fetching yesterday stats:', error);
      return { completedSessions: 0 };
    }
    
    return {
      completedSessions: data || 0
    };
  } catch (error) {
    console.error('Error fetching yesterday\'s stats:', error);
    return { completedSessions: 0 };
  }
};
