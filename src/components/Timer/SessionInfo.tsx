
import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTotalMetrics } from '@/hooks/dashboard/stats/useTotalMetrics';

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
  const currentDateRef = useRef<string>(new Date().toISOString().split('T')[0]);
  
  const fetchTodayStats = async () => {
    if (!user) {
      setIsLoading(false);
      setStats({
        focusSessions: 0,
        focusMinutes: 0,
        yesterdayFocusSessions: null,
        yesterdayFocusMinutes: null
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Always use fresh date objects for today and yesterday
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayDateString = today.toISOString().split('T')[0];
      const yesterdayDateString = yesterday.toISOString().split('T')[0];
      
      // Update current date reference
      currentDateRef.current = todayDateString;
      
      console.log('SessionInfo: Fetching stats for date:', todayDateString);
      
      // Use the fetchTotalMetrics function to get today's metrics
      const todayMetrics = await fetchTotalMetrics(user.id, todayDateString);
      const yesterdayMetrics = await fetchTotalMetrics(user.id, yesterdayDateString);
      
      // Set today's stats from the metrics
      setStats({
        focusSessions: todayMetrics.totalSessions || 0,
        focusMinutes: todayMetrics.totalMinutes || 0,
        yesterdayFocusSessions: yesterdayMetrics.totalSessions || null,
        yesterdayFocusMinutes: yesterdayMetrics.totalMinutes || null
      });
      
      console.log('SessionInfo updated with metrics:', {
        today: { sessions: todayMetrics.totalSessions, minutes: todayMetrics.totalMinutes },
        yesterday: { sessions: yesterdayMetrics.totalSessions, minutes: yesterdayMetrics.totalMinutes }
      });
      
    } catch (error) {
      console.error('Error in stats fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial load of stats
  useEffect(() => {
    fetchTodayStats();
    
    // Set up a refresh interval
    const intervalId = setInterval(() => {
      fetchTodayStats();
    }, 3 * 60 * 1000); // Refresh every 3 minutes
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  // Set up realtime subscription to update stats
  useEffect(() => {
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
          (payload) => {
            console.log('Session summary changed:', payload);
            fetchTodayStats();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  // Check for date changes every minute
  useEffect(() => {
    const dateCheckIntervalId = setInterval(() => {
      const currentDate = new Date().toISOString().split('T')[0];
      if (currentDate !== currentDateRef.current) {
        console.log('SessionInfo: Date changed from', currentDateRef.current, 'to', currentDate, '- refreshing stats');
        fetchTodayStats();
      }
    }, 60000); // Check every minute

    return () => clearInterval(dateCheckIntervalId);
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
