
import { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialDashboardData);

  const { stats, fetchTotalStats } = useStatsData(user?.id);
  const { productivityTrend, fetchProductivityTrends } = useProductivityTrends(user?.id);
  const { streakData, fetchStreakData } = useStreakData(user?.id);
  const { insights, fetchInsights } = useInsights(user?.id);
  const { productivityData, fetchAllProductivityData } = useProductivityData(user?.id);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Fetching dashboard data for user:', user?.id);
      
      // Fetch all data in parallel
      const [statsData, trendsData, streakResult, insightsData, productivityResults] = await Promise.all([
        fetchTotalStats(),
        fetchProductivityTrends(),
        fetchStreakData(),
        fetchInsights(),
        fetchAllProductivityData()
      ]);
      
      // Combine all the results
      setDashboardData({
        stats: statsData || initialDashboardData.stats,
        productivityTrend: trendsData || [],
        streakData: streakResult || [],
        insights: insightsData || [],
        dailyProductivity: productivityResults?.dailyProductivity || [],
        weeklyProductivity: productivityResults?.weeklyProductivity || [],
        monthlyProductivity: productivityResults?.monthlyProductivity || []
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error.message);
      toast({
        title: "Error loading dashboard data",
        description: "There was a problem fetching your productivity data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    user?.id,
    fetchTotalStats,
    fetchProductivityTrends,
    fetchStreakData,
    fetchInsights,
    fetchAllProductivityData,
    toast
  ]);

  // Set up initial data fetch
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);
  
  // Set up realtime updates
  useRealtimeUpdates(user?.id, fetchDashboardData);

  return { 
    dashboardData, 
    isLoading, 
    refreshData: fetchDashboardData 
  };
};
