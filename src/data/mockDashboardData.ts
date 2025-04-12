
// Mock data for demonstration purposes

export const mockStreakData = Array.from({ length: 28 }, (_, i) => ({
  date: new Date(Date.now() - (27 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  completed: Math.floor(Math.random() * 10) // Random completion between 0-10
}));

export const mockDailyData = [
  { name: '8AM', sessions: 1, minutes: 25 },
  { name: '10AM', sessions: 2, minutes: 50 },
  { name: '12PM', sessions: 1, minutes: 25 },
  { name: '2PM', sessions: 3, minutes: 75 },
  { name: '4PM', sessions: 2, minutes: 50 },
  { name: '6PM', sessions: 1, minutes: 25 },
];

export const mockWeeklyData = [
  { name: 'Mon', sessions: 5, minutes: 125 },
  { name: 'Tue', sessions: 7, minutes: 175 },
  { name: 'Wed', sessions: 4, minutes: 100 },
  { name: 'Thu', sessions: 8, minutes: 200 },
  { name: 'Fri', sessions: 6, minutes: 150 },
  { name: 'Sat', sessions: 3, minutes: 75 },
  { name: 'Sun', sessions: 2, minutes: 50 },
];

export const mockMonthlyData = [
  { name: 'Week 1', sessions: 20, minutes: 500 },
  { name: 'Week 2', sessions: 35, minutes: 875 },
  { name: 'Week 3', sessions: 25, minutes: 625 },
  { name: 'Week 4', sessions: 30, minutes: 750 },
];

// Mock insights data
export const mockInsights = [
  {
    title: "Best Focus Time",
    content: "Your most productive hours are between 2:00 PM - 4:00 PM. Consider scheduling your most important tasks during this time frame."
  },
  {
    title: "Session Length Analysis",
    content: "You complete the most tasks when working in 25-minute focused sessions followed by 5-minute breaks."
  },
  {
    title: "Productivity Trend",
    content: "Your focus time has increased by 15% compared to last week. Keep up the great work!"
  }
];

// Mock stats data
export const mockStats = [
  { title: "Today's Focus", value: "125 min", icon: "Clock", trend: { value: 15, isPositive: true } },
  { title: "Current Streak", value: "7 days", icon: "Flame", trend: { value: 40, isPositive: true } },
  { title: "Completion Rate", value: "85%", icon: "Target", trend: { value: 5, isPositive: false } },
  { title: "Weekly Sessions", value: "32", icon: "Zap", description: "Total focus sessions this week" }
];

// Generate wave-like productivity trend data for the last 30 days
export const mockProductivityTrend = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  
  // Create a wave pattern with some randomness
  const baseValue = 65;
  const amplitude = 20;
  const frequency = 0.3;
  const phase = i * frequency;
  const random = Math.random() * 10 - 5; // Random value between -5 and 5
  
  const productivity = Math.round(baseValue + amplitude * Math.sin(phase) + random);
  
  return {
    date: date.toISOString().split('T')[0],
    productivity: Math.max(0, Math.min(100, productivity)) // Ensure value is between 0-100
  };
});

// Create a single export object that contains all mock data
export const mockDashboardData = {
  streakData: mockStreakData,
  dailyProductivity: mockDailyData,
  weeklyProductivity: mockWeeklyData,
  monthlyProductivity: mockMonthlyData,
  insights: mockInsights,
  stats: mockStats,
  productivityTrend: mockProductivityTrend
};
