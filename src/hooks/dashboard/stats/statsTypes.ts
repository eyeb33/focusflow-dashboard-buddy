
export interface StatsData {
  totalSessions: number;
  totalMinutes: number;
  dailyAverage: number;
  currentStreak: number;
  bestStreak: number;
  weeklyChange: {
    sessions: number;
    minutes: number;
    dailyAvg: number;
    isPositive: boolean;
  };
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
  }
};
