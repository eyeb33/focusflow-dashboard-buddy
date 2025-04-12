
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StreakDay {
  date: string;
  completed: number; // Number of pomodoros completed
}

interface StreakCalendarProps {
  data: StreakDay[];
  currentStreak: number;
  bestStreak: number;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ data, currentStreak, bestStreak }) => {
  // Generate last 4 weeks of dates for the calendar
  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 27; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find matching data or use default
      const dayData = data.find(d => d.date === dateStr) || { date: dateStr, completed: 0 };
      
      days.push({
        ...dayData,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        isToday: i === 0
      });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  // Group days by week
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(calendarDays.slice(i * 7, (i + 1) * 7));
  }
  
  // Get intensity class based on number of pomodoros
  const getIntensityClass = (completed: number) => {
    if (completed === 0) return 'bg-gray-100';
    if (completed < 2) return 'bg-pomodoro-work/20';
    if (completed < 4) return 'bg-pomodoro-work/40';
    if (completed < 6) return 'bg-pomodoro-work/60';
    if (completed < 8) return 'bg-pomodoro-work/80';
    return 'bg-pomodoro-work';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Your Streaks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold">{currentStreak} days</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Best Streak</p>
            <p className="text-2xl font-bold">{bestStreak} days</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-xs font-medium text-center text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`
                    h-6 rounded-sm flex items-center justify-center text-xs
                    ${getIntensityClass(day.completed)}
                    ${day.isToday ? 'ring-2 ring-pomodoro-work' : ''}
                  `}
                  title={`${day.date}: ${day.completed} sessions`}
                >
                  {day.completed > 0 && (
                    <span className={`font-medium ${day.completed >= 4 ? 'text-white' : ''}`}>
                      {day.completed}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCalendar;
