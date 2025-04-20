
export interface WeeklyMonthlyStats {
  totalSessions: number;
  totalMinutes: number;
  dailyAverage?: number;
  completedCycles?: number; // <--- for completed cycles in the period
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
  completedCycles: number; // <--- added per period for the dashboard
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

