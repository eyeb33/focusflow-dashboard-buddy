
import { supabase } from '@/integrations/supabase/client';

export const fetchCompletedCycles = async (userId: string, periodStart: Date, periodEnd: Date, sessionsUntilLongBreak: number) => {
  if (periodStart.toDateString() !== new Date().toDateString()) {
    const { data, error } = await supabase
      .from('sessions_summary')
      .select('total_completed_sessions, date')
      .eq('user_id', userId)
      .gte('date', periodStart.toISOString().split('T')[0])
      .lte('date', periodEnd.toISOString().split('T')[0]);

    if (error) {
      console.error("Error fetching sessions_summary for cycles:", error);
      return 0;
    }

    const totalSessions = data?.reduce((sum, day) => sum + (day.total_completed_sessions || 0), 0) || 0;
    return Math.floor(totalSessions / sessionsUntilLongBreak);
  }
  
  return 0;
};
