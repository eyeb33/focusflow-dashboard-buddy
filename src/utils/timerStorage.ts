
import { supabase } from '@/integrations/supabase/client';

export interface FocusSession {
  user_id: string;
  session_type: 'work' | 'break' | 'longBreak';
  duration: number;
  completed: boolean;
}

export const saveFocusSession = async (userId: string, sessionType: 'work' | 'break' | 'longBreak', duration: number, completed: boolean = true) => {
  try {
    if (!userId) return;
    
    const { error } = await supabase.from('focus_sessions').insert({
      user_id: userId,
      session_type: sessionType,
      duration: duration,
      completed: completed
    });
    
    if (error) {
      console.error('Error saving session:', error);
      return false;
    } 
    
    console.log('Session saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
};

export const fetchTodayStats = async (userId: string | undefined) => {
  if (!userId) return { completedSessions: 0, totalTimeToday: 0 };
  
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .eq('completed', true)
      .gte('created_at', startOfDay.toISOString());
      
    if (error) throw error;
    
    const totalMinutes = data.reduce((total, session) => {
      return total + Math.floor(session.duration / 60);
    }, 0);
    
    return {
      completedSessions: data.length,
      totalTimeToday: totalMinutes
    };
  } catch (error) {
    console.error('Error fetching today\'s stats:', error);
    return { completedSessions: 0, totalTimeToday: 0 };
  }
};
