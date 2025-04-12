
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

