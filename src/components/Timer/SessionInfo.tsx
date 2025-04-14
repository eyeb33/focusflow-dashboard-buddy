
import React, { useEffect, useState } from 'react';
import { useTimerStats } from '@/hooks/useTimerStats';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DailyStats {
  focusSessions: number;
  focusMinutes: number;
  yesterdayFocusSessions: number | null;
  yesterdayFocusMinutes: number | null;
}

const SessionInfo: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats>({
    focusSessions: 0,
    focusMinutes: 0,
    yesterdayFocusSessions: null,
    yesterdayFocusMinutes: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTodayStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get today's date and yesterday's date in YYYY-MM-DD format
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayDateString = today.toISOString().split('T')[0];
        const yesterdayDateString = yesterday.toISOString().split('T')[0];
        
        // Fetch today's stats
        const { data: todayData, error: todayError } = await supabase
          .from('sessions_summary')
          .select('total_completed_sessions, total_focus_time')
          .eq('user_id', user.id)
          .eq('date', todayDateString)
          .maybeSingle();
          
        if (todayError) {
          console.error('Error fetching today stats:', todayError);
        }
        
        // Fetch yesterday's stats
        const { data: yesterdayData, error: yesterdayError } = await supabase
          .from('sessions_summary')
          .select('total_completed_sessions, total_focus_time')
          .eq('user_id', user.id)
          .eq('date', yesterdayDateString)
          .maybeSingle();
          
        if (yesterdayError) {
          console.error('Error fetching yesterday stats:', yesterdayError);
        }
        
        setStats({
          focusSessions: todayData?.total_completed_sessions || 0,
          focusMinutes: todayData?.total_focus_time || 0,
          yesterdayFocusSessions: yesterdayData?.total_completed_sessions || null,
          yesterdayFocusMinutes: yesterdayData?.total_focus_time || null
        });
      } catch (error) {
        console.error('Error in stats fetch:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTodayStats();
    
    // Set up realtime subscription to update stats
    if (user) {
      const channel = supabase
        .channel('sessions-summary-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'sessions_summary',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            // Refresh stats on any changes
            fetchTodayStats();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  // Calculate percentage differences
  const calculateDifference = (current: number, previous: number | null): number | null => {
    if (previous === null || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  };
  
  const sessionsDiff = calculateDifference(stats.focusSessions, stats.yesterdayFocusSessions);
  const minutesDiff = calculateDifference(stats.focusMinutes, stats.yesterdayFocusMinutes);
  
  return (
    <div className="mt-8 space-y-3">
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium text-center mb-3">Today's Stats</h4>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-xl font-bold">{stats.focusSessions}</div>
            <div className="text-xs text-muted-foreground">Focus Sessions</div>
            {!isLoading && sessionsDiff !== null && (
              <div className="flex items-center justify-center mt-1 text-xs">
                <span className={cn(
                  "flex items-center",
                  sessionsDiff > 0 ? "text-green-500" : 
                  sessionsDiff < 0 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {sessionsDiff > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : 
                   sessionsDiff < 0 ? <ArrowDown className="h-3 w-3 mr-0.5" /> : 
                   <Minus className="h-3 w-3 mr-0.5" />}
                  {Math.abs(sessionsDiff)}%
                </span>
              </div>
            )}
          </div>
          <div>
            <div className="text-xl font-bold">{stats.focusMinutes}</div>
            <div className="text-xs text-muted-foreground">Focus Minutes</div>
            {!isLoading && minutesDiff !== null && (
              <div className="flex items-center justify-center mt-1 text-xs">
                <span className={cn(
                  "flex items-center",
                  minutesDiff > 0 ? "text-green-500" : 
                  minutesDiff < 0 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {minutesDiff > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : 
                   minutesDiff < 0 ? <ArrowDown className="h-3 w-3 mr-0.5" /> : 
                   <Minus className="h-3 w-3 mr-0.5" />}
                  {Math.abs(minutesDiff)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionInfo;
