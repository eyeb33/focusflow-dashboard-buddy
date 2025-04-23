
import { supabase } from '@/integrations/supabase/client';
import { WeeklyMonthlyStats } from './statsTypes';
import { fetchCompletedCycles } from './useCompletedCycles';

export const fetchWeeklyStats = async (userId: string): Promise<WeeklyMonthlyStats> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString();
  const today = new Date();

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration')
    .eq('user_id', userId)
    .eq('session_type', 'work')
    .eq('completed', true)
    .gte('created_at', oneWeekAgoStr);

  let totalSessions = 0;
  let totalMinutes = 0;
  if (!error && Array.isArray(data)) {
    totalSessions = data.length;
    totalMinutes = data.reduce((acc, session) => acc + Math.min(Math.floor((session.duration || 0) / 60), 60), 0);
  }

  const sessionsUntilLongBreak = 4;
  const completedCycles = await fetchCompletedCycles(userId, oneWeekAgo, today, sessionsUntilLongBreak);

  return {
    totalSessions,
    totalMinutes,
    dailyAverage: totalSessions > 0 ? Math.round(totalSessions / 7 * 10) / 10 : 0,
    completedCycles,
  };
};

export const fetchMonthlyStats = async (userId: string): Promise<WeeklyMonthlyStats> => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString();
  const today = new Date();

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration')
    .eq('user_id', userId)
    .eq('session_type', 'work')
    .eq('completed', true)
    .gte('created_at', oneMonthAgoStr);

  let totalSessions = 0;
  let totalMinutes = 0;
  if (!error && Array.isArray(data)) {
    totalSessions = data.length;
    totalMinutes = data.reduce((acc, session) => acc + Math.min(Math.floor((session.duration || 0) / 60), 60), 0);
  }

  const sessionsUntilLongBreak = 4;
  const completedCycles = await fetchCompletedCycles(userId, oneMonthAgo, today, sessionsUntilLongBreak);

  return {
    totalSessions,
    totalMinutes,
    dailyAverage: totalSessions > 0 ? Math.round(totalSessions / 30 * 10) / 10 : 0,
    completedCycles,
  };
};
