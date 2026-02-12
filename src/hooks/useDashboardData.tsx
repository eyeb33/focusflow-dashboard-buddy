
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStatsData } from "@/hooks/dashboard/useStatsData";
import { useProductivityData } from "@/hooks/dashboard/useProductivityData";
import { useInsights } from "@/hooks/dashboard/useInsights";
import { useStreakData } from "@/hooks/dashboard/useStreakData";
import { useProductivityTrends } from "@/hooks/dashboard/useProductivityTrends";
import { useRealtimeUpdates } from "@/hooks/dashboard/useRealtimeUpdates";
import { mockDashboardData } from '@/data/mockDashboardData';

export const useDashboardData = () => {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Track tab visibility changes
  const wasDocumentHidden = useRef<boolean>(false);
  const lastRefreshTime = useRef<number>(Date.now());
  // Increase refresh interval to reduce database calls
  const refreshInterval = 60 * 1000; // 60 seconds - less frequent updates
  
  // Use current date for consistency
  const today = new Date().toISOString().split('T')[0];
  
  // Set up hooks for data fetching - only if we have a userId
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
  
  // Set up realtime updates only if we have a userId
  useRealtimeUpdates(userId);
  
  // Create a memoized refetch function to avoid unnecessary re-renders
  const refetchData = useCallback(() => {
    if (userId) {
      console.log('Refreshing all dashboard data');
      refetchStats();
      refetchProductivity();
      refetchStreak();
      
      // Update refresh time
      lastRefreshTime.current = Date.now();
    }
  }, [userId, refetchStats, refetchProductivity, refetchStreak]);
  
  // Handle visibility changes to ensure data consistency - only if we have a userId
  useEffect(() => {
    if (!userId) return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        wasDocumentHidden.current = true;
      } else if (wasDocumentHidden.current) {
        // Always check if enough time has passed since last refresh
        const now = Date.now();
        if (now - lastRefreshTime.current >= refreshInterval) {
          refetchData();
        }
        wasDocumentHidden.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, refetchData]);

  // Set up periodic data refresh - only if we have a userId
  useEffect(() => {
    if (!userId) return;
    
    // Initial data fetch
    refetchData();
        // Removed polling - relying on realtime subscriptions for updates
    
  }, [userId, refetchData]);
  
  // If there's no user, return mock data with no loading state
  if (!userId) {
    return {
      dashboardData: mockDashboardData,
      isLoading: false,
      refetch: () => console.log('Demo mode - no data to refresh')
    };
  }
  
  // Combined data for authenticated users
  const dashboardData = {
    stats,
    dailyProductivity,
    weeklyProductivity,
    monthlyProductivity,
    insights,
    streakData,
    productivityTrend
  };
  
  const isLoading = statsLoading || productivityLoading || insightsLoading || streakLoading || trendsLoading;

  return {
    dashboardData,
    isLoading,
    refetch: refetchData
  };
};
