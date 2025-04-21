
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
  const wasDocumentHidden = useRef(false);
  
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
        // Refetch data when returning to the page to ensure everything is in sync
        refetchData();
        wasDocumentHidden.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  const refetchData = () => {
    if (userId) {
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
    trends: productivityTrend // Fix: Using productivityTrend instead of trends
  };
  
  const isLoading = statsLoading || productivityLoading || insightsLoading || streakLoading || trendsLoading;

  return {
    dashboardData,
    isLoading,
    refetch: refetchData
  };
};
