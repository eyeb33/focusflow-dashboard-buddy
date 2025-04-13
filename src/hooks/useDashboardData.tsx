
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DashboardData, initialDashboardData } from './dashboard/types';
import { useStatsData } from './dashboard/useStatsData';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export type { DashboardData } from './dashboard/types';

export const useDashboardData = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize stats data hook with React Query
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useStatsData(user?.id);

  // Set up realtime updates to automatically invalidate queries
  useRealtimeUpdates(user?.id);

  // Define a function to manually refresh all data
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('Manually refreshing dashboard data for user:', user?.id);
      
      // Refresh stats query
      await refetchStats();
      
      toast({
        title: "Dashboard refreshed",
        description: "Latest productivity data has been loaded.",
      });
      
      console.log('Dashboard data refreshed successfully');
    } catch (error: any) {
      console.error('Error refreshing dashboard data:', error.message);
      toast({
        title: "Error loading dashboard data",
        description: "There was a problem fetching your productivity data.",
        variant: "destructive",
      });
    }
  }, [user?.id, refetchStats, toast]);

  // Determine overall loading state
  const isLoading = statsLoading;

  // Combine data into dashboard data object
  const dashboardData: DashboardData = {
    stats,
    productivityTrend: [],
    streakData: [],
    insights: [],
    dailyProductivity: [],
    weeklyProductivity: [],
    monthlyProductivity: []
  };

  return { 
    dashboardData: isLoading ? initialDashboardData : dashboardData, 
    isLoading, 
    refreshData: fetchDashboardData 
  };
};
