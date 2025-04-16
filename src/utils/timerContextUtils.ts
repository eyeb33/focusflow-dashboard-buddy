
import { supabase } from '@/integrations/supabase/client';

export type TimerMode = 'work' | 'break' | 'longBreak';

export const loadTodayStats = async (userId: string | undefined) => {
  if (!userId) return { completedSessions: 0, totalTimeToday: 0 };
  
  try {
    // Ensure we're always using the current date
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('loadTodayStats: Fetching stats for today:', today);
    
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
        totalTimeToday: summaryData.total_focus_time || 0
      };
    } else {
      console.log('No summary data found for today, checking for individual sessions');
      
      if (summaryError && summaryError.code !== 'PGRST116') {
        console.error('Error fetching summary data:', summaryError);
      }
    }
    
    // If no summary exists, fall back to calculating from individual sessions
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Fetch all work sessions from today, both complete and partial
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
      
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

// Add the sessions_summary table to the realtime publication
export const enableRealtimeForSessionsSummary = async () => {
  try {
    // Instead of using RPC, we'll use the native Supabase realtime functionality
    // Check if channel can be created for sessions_summary table
    const channel = supabase
      .channel('sessions-summary-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sessions_summary' 
        }, 
        () => console.log('Sessions summary table is now being monitored for realtime updates')
      );
      
    // Subscribe to the channel
    const subscription = await channel.subscribe();
    
    // Fix the type error by checking the subscription status differently
    console.log('Subscription status:', subscription);
    
    // We'll remove the channel after a short delay to avoid multiple subscriptions
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 5000);
    
  } catch (error) {
    console.error('Error configuring realtime for sessions_summary:', error);
  }
};

export const getTotalTime = (timerMode: TimerMode, settings: any): number => {
  switch (timerMode) {
    case 'work':
      return settings.workDuration * 60;
    case 'break':
      return settings.breakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
    default:
      return settings.workDuration * 60;
  }
};

interface PartialSessionResult {
  newFullMinutes: number;
  success: boolean;
}

export const savePartialSession = async (userId: string, sessionType: 'work' | 'break' | 'longBreak', totalTime: number, timeRemaining: number, lastRecordedFullMinutes: number): Promise<PartialSessionResult | boolean> => {
  try {
    if (!userId) return false;
    
    const duration = totalTime - timeRemaining;
    
    // Check if the session was running for at least a minute
    if (duration >= 60) {
      // Save the session with the actual duration
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        session_type: sessionType,
        duration: duration,
        completed: false
      });
      
      if (error) {
        console.error('Error saving partial session:', error);
        return false;
      }
      
      console.log('Partial session saved successfully', { sessionType, duration });
      
      // Return an object with the new full minutes
      const newFullMinutes = Math.floor(duration / 60);
      return { 
        success: true, 
        newFullMinutes 
      };
    } else {
      console.log('Session duration less than a minute, not saving.');
      return false;
    }
  } catch (error) {
    console.error('Error saving partial session:', error);
    return false;
  }
};
