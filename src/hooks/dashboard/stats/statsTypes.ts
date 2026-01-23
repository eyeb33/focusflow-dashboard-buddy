export interface WeeklyMonthlyStats {
  totalSessions: number;
  totalMinutes: number;
  dailyAverage?: number;
  completedCycles?: number;
  sessionsTrend?: number;
  minutesTrend?: number;
}

export interface WeeklyChange {
  sessions: number;
  minutes: number;
  dailyAvg: number;
  isPositive: boolean;
}

export interface DailyStats {
  sessionsTrend: number;
  minutesTrend: number;
}

export interface StatsData {
  totalSessions: number;
  totalMinutes: number;
  completedCycles: number;
  dailyAverage: number;
  currentStreak: number;
  bestStreak: number;
  weeklyChange: WeeklyChange;
  monthlyChange?: WeeklyChange;
  weeklyStats?: WeeklyMonthlyStats;
  monthlyStats?: WeeklyMonthlyStats;
  dailyStats?: DailyStats;
}

export const initialStatsData: StatsData = {
  totalSessions: 0,
  totalMinutes: 0,
  completedCycles: 0,
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
    dailyAverage: 0,
    completedCycles: 0,
  },
  monthlyStats: {
    totalSessions: 0,
    totalMinutes: 0,
    dailyAverage: 0,
    completedCycles: 0,
  }
};
