
import { ProductivityDataPoint } from './productivity/types';
import { StreakDay } from './useStreakData';
import { TrendData } from './useProductivityTrends';
import { InsightData } from './useInsights';
import { StatsData } from './stats/statsTypes';

export interface DashboardData {
  stats: StatsData;
  productivityTrend: TrendData[];
  streakData: StreakDay[];
  insights: InsightData[];
  dailyProductivity: ProductivityDataPoint[];
  weeklyProductivity: ProductivityDataPoint[];
  monthlyProductivity: ProductivityDataPoint[];
}

export const initialDashboardData: DashboardData = {
  stats: {
    totalSessions: 0,
    totalMinutes: 0,
    dailyAverage: 0,
    currentStreak: 0,
    bestStreak: 0,
    weeklyChange: {
      sessions: 0,
      minutes: 0,
      dailyAvg: 0,
      isPositive: true
    }
  },
  productivityTrend: [],
  streakData: [],
  insights: [],
  dailyProductivity: [],
  weeklyProductivity: [],
  monthlyProductivity: []
};
