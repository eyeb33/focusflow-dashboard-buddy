
import { supabase } from '@/integrations/supabase/client';

export interface WeeklyChangeData {
  sessions: number;
  minutes: number;
  dailyAvg: number;
  isPositive: boolean;
}

/**
 * Hook to calculate weekly changes in user statistics
 */
export const calculateWeeklyChanges = async (userId: string): Promise<WeeklyChangeData> => {
  // Get current week's sessions
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
  
  const { data: currentWeekSessions, error: currentWeekError } = await supabase
    .from('focus_sessions')
    .select('duration, created_at')
    .eq('user_id', userId)
    .eq('session_type', 'work')
    .eq('completed', true)
    .gte('created_at', oneWeekAgoStr);
    
  // Get previous week's sessions
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];
  
  const { data: prevWeekSessions, error: prevWeekError } = await supabase
    .from('focus_sessions')
    .select('duration, created_at')
    .eq('user_id', userId)
    .eq('session_type', 'work')
    .eq('completed', true)
    .gte('created_at', twoWeeksAgoStr)
    .lt('created_at', oneWeekAgoStr);
    
  if (currentWeekError || prevWeekError) {
    console.error('Error fetching weekly comparison data');
  }
  
  // Calculate weekly changes
  const currentWeekSessionCount = currentWeekSessions?.length || 0;
  const prevWeekSessionCount = prevWeekSessions?.length || 0;
  
  const currentWeekMinutes = currentWeekSessions?.reduce((acc: number, session: any) => 
    acc + Math.floor(session.duration / 60), 0) || 0;
    
  const prevWeekMinutes = prevWeekSessions?.reduce((acc: number, session: any) => 
    acc + Math.floor(session.duration / 60), 0) || 0;
    
  // Calculate session change percentage
  let sessionChangePercent = 0;
  if (prevWeekSessionCount > 0) {
    sessionChangePercent = Math.round(((currentWeekSessionCount - prevWeekSessionCount) / prevWeekSessionCount) * 100);
  } else if (currentWeekSessionCount > 0) {
    sessionChangePercent = 100; // If there were no sessions last week but there are this week
  }
  
  // Calculate minutes change percentage
  let minutesChangePercent = 0;
  if (prevWeekMinutes > 0) {
    minutesChangePercent = Math.round(((currentWeekMinutes - prevWeekMinutes) / prevWeekMinutes) * 100);
  } else if (currentWeekMinutes > 0) {
    minutesChangePercent = 100; // If there were no minutes last week but there are this week
  }
  
  // Calculate avg sessions per day
  const currentWeekAvg = currentWeekSessionCount / 7;
  const prevWeekAvg = prevWeekSessionCount / 7;
  
  let avgChangePercent = 0;
  if (prevWeekAvg > 0) {
    avgChangePercent = Math.round(((currentWeekAvg - prevWeekAvg) / prevWeekAvg) * 100);
  } else if (currentWeekAvg > 0) {
    avgChangePercent = 100; // If there was no average last week but there is this week
  }
  
  return {
    sessions: sessionChangePercent,
    minutes: minutesChangePercent,
    dailyAvg: avgChangePercent,
    isPositive: sessionChangePercent >= 0
  };
};
