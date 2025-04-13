
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardData, initialDashboardData } from './dashboard/types';
import { useStatsData } from './dashboard/useStatsData';
import { useProductivityTrends } from './dashboard/useProductivityTrends';
import { useStreakData } from './dashboard/useStreakData';
import { useInsights } from './dashboard/useInsights';
import { useProductivityData } from './dashboard/useProductivityData';
import { useRealtimeUpdates } from './dashboard/useRealtimeUpdates';

export type { DashboardData } from './dashboard/types';

export const useDashboardData = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize all data hooks with React Query
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useStatsData(user?.id);
  const { productivityTrend, isLoading: trendLoading, refetch: refetchTrends } = useProductivityTrends(user?.id);
  const { streakData, isLoading: streakLoading, refetch: refetchStreak } = useStreakData(user?.id);
  const { insights, isLoading: insightsLoading, refetch: refetchInsights } = useInsights(user?.id);
  const { 
    dailyProductivity, 
    weeklyProductivity, 
    monthlyProductivity, 
    isLoading: productivityLoading,
    refetch: refetchProductivity 
  } = useProductivityData(user?.id);

  // Set up realtime updates to automatically invalidate queries
  useRealtimeUpdates(user?.id);

  // Define a function to manually refresh all data
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('Manually refreshing dashboard data for user:', user?.id);
      
      // Refresh all queries in parallel
      await Promise.all([
        refetchStats(),
        refetchTrends(),
        refetchStreak(),
        refetchInsights(),
        refetchProductivity()
      ]);
      
      toast({
        title: "Dashboard refreshed",
        description: "Latest productivity data has been loaded.",
      });
      
      console.log('All dashboard data refreshed successfully');
    } catch (error: any) {
      console.error('Error refreshing dashboard data:', error.message);
      toast({
        title: "Error loading dashboard data",
        description: "There was a problem fetching your productivity data.",
        variant: "destructive",
      });
    }
  }, [
    user?.id,
    refetchStats,
    refetchTrends,
    refetchStreak,
    refetchInsights,
    refetchProductivity,
    toast
  ]);

  // Determine overall loading state
  const isLoading = statsLoading || trendLoading || streakLoading || insightsLoading || productivityLoading;

  // Combine all data into dashboard data object
  const dashboardData: DashboardData = {
    stats,
    productivityTrend,
    streakData,
    insights,
    dailyProductivity,
    weeklyProductivity,
    monthlyProductivity
  };

  return { 
    dashboardData: isLoading ? initialDashboardData : dashboardData, 
    isLoading, 
    refreshData: fetchDashboardData 
  };
};
