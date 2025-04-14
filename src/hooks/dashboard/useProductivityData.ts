
import { useCallback } from 'react';
import { useDailyProductivity } from './productivity/useDailyProductivity';
import { useWeeklyProductivity } from './productivity/useWeeklyProductivity';
import { useMonthlyProductivity } from './productivity/useMonthlyProductivity';
import { ProductivityDataPoint } from './productivity/types';

export type { ProductivityDataPoint } from './productivity/types';

export const useProductivityData = (userId: string | undefined) => {
  const dailyQuery = useDailyProductivity(userId);
  const weeklyQuery = useWeeklyProductivity(userId);
  const monthlyQuery = useMonthlyProductivity(userId);

  const refetch = useCallback(() => {
    dailyQuery.refetch();
    weeklyQuery.refetch();
    monthlyQuery.refetch();
  }, [dailyQuery, weeklyQuery, monthlyQuery]);

  return {
    dailyProductivity: dailyQuery.data || [],
    weeklyProductivity: weeklyQuery.data || [],
    monthlyProductivity: monthlyQuery.data || [],
    isLoading: dailyQuery.isLoading || weeklyQuery.isLoading || monthlyQuery.isLoading,
    isError: dailyQuery.isError || weeklyQuery.isError || monthlyQuery.isError,
    refetch
  };
};
