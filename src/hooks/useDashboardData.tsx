
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStatsData } from "@/hooks/dashboard/useStatsData";
import { useProductivityData } from "@/hooks/dashboard/useProductivityData";
import { useInsights } from "@/hooks/dashboard/useInsights";
import { useStreakData } from "@/hooks/dashboard/useStreakData";
import { useProductivityTrends } from "@/hooks/dashboard/useProductivityTrends";
import { useRealtimeUpdates } from "@/hooks/dashboard/useRealtimeUpdates";

export const useDashboardData = () => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Track tab visibility changes
  const wasDocumentHidden = useRef<boolean>(false);
  const lastRefreshTime = useRef<number>(Date.now());
  const refreshInterval = 30 * 1000; // 30 seconds - more frequent updates
  
  // Use current date for consistency
  const today = new Date().toISOString().split('T')[0];
  
  // Set up hooks for data fetching
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useStatsData(userId);
  const { 
    dailyProductivity, 
    weeklyProductivity, 
    monthlyProductivity, 
    isLoading: productivityLoading,
    refetch: refetchProductivity
  } = useProductivityData(userId);
  const { insights, isLoading: insightsLoading } = useInsights(userId);
  const { streakData, isLoading: streakLoading, refetch: refetchStreak } = useStreakData(userId);
  const { productivityTrend, isLoading: trendsLoading } = useProductivityTrends(userId);
  
  // Set up realtime updates
  useRealtimeUpdates(userId);

  // Handle visibility changes to ensure data consistency
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasDocumentHidden.current = true;
      } else if (wasDocumentHidden.current) {
        // Always refetch data when returning to the page for consistency
        refetchData();
        lastRefreshTime.current = Date.now();
        wasDocumentHidden.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  // Set up periodic data refresh
  useEffect(() => {
    if (!userId) return;
    
    // Initial data fetch
    refetchData();
    
    // Refresh data more frequently when the dashboard is visible
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        const now = Date.now();
        if (now - lastRefreshTime.current >= refreshInterval) {
          console.log('Periodic dashboard refresh triggered');
          refetchData();
          lastRefreshTime.current = now;
        }
      }
    }, 5000); // Check every 5 seconds, refresh after the interval
    
    return () => clearInterval(intervalId);
  }, [userId]);

  const refetchData = () => {
    if (userId) {
      console.log('Refreshing all dashboard data');
      refetchStats();
      refetchProductivity();
      refetchStreak();
    }
  };
  
  // Combined data
  const dashboardData = {
    stats,
    dailyProductivity,
    weeklyProductivity,
    monthlyProductivity,
    insights,
    streakData,
    trends: productivityTrend
  };
  
  const isLoading = statsLoading || productivityLoading || insightsLoading || streakLoading || trendsLoading;

  return {
    dashboardData,
    isLoading,
    refetch: refetchData
  };
};
