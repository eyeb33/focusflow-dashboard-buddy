
export const calculateTrendPercentage = (current: number, previous: number): number => {
  // Don't calculate trend if current value is 0
  if (current === 0) return 0;
  // If previous was 0 and current is not, that's a 100% increase
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
};

export interface TrendCalculationResult {
  dailySessionsTrend: number;
  dailyMinutesTrend: number;
  weeklySessionsTrend: number;
  weeklyMinutesTrend: number;
  monthlySessionsTrend: number;
  monthlyMinutesTrend: number;
}

export const calculateAllTrends = (
  todayMetrics: { totalSessions: number; totalMinutes: number },
  yesterdayMetrics: { totalSessions: number; totalMinutes: number },
  weeklyStats: { totalSessions: number; totalMinutes: number },
  lastWeekStats: { totalSessions: number; totalMinutes: number },
  monthlyStats: { totalSessions: number; totalMinutes: number },
  lastMonthStats: { totalSessions: number; totalMinutes: number }
): TrendCalculationResult => {
  return {
    dailySessionsTrend: calculateTrendPercentage(todayMetrics.totalSessions, yesterdayMetrics.totalSessions),
    dailyMinutesTrend: calculateTrendPercentage(todayMetrics.totalMinutes, yesterdayMetrics.totalMinutes),
    weeklySessionsTrend: calculateTrendPercentage(weeklyStats.totalSessions, lastWeekStats.totalSessions),
    weeklyMinutesTrend: calculateTrendPercentage(weeklyStats.totalMinutes, lastWeekStats.totalMinutes),
    monthlySessionsTrend: calculateTrendPercentage(monthlyStats.totalSessions, lastMonthStats.totalSessions),
    monthlyMinutesTrend: calculateTrendPercentage(monthlyStats.totalMinutes, lastMonthStats.totalMinutes)
  };
};
