
export interface WeeklyMonthlyStats {
  totalSessions: number;
  totalMinutes: number;
  dailyAverage?: number;
}

export interface WeeklyChange {
  sessions: number;
  minutes: number;
  dailyAvg: number;
  isPositive: boolean;
}

export interface StatsData {
  totalSessions: number;
  totalMinutes: number;
  dailyAverage: number;
  currentStreak: number;
  bestStreak: number;
  weeklyChange: WeeklyChange;
  weeklyStats?: WeeklyMonthlyStats;
  monthlyStats?: WeeklyMonthlyStats;
}

export const initialStatsData: StatsData = {
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
  },
  weeklyStats: {
    totalSessions: 0,
    totalMinutes: 0,
    dailyAverage: 0
  },
  monthlyStats: {
    totalSessions: 0,
    totalMinutes: 0,
    dailyAverage: 0
  }
};
