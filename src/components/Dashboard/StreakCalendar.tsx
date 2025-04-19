
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, getDay, startOfWeek, endOfWeek } from 'date-fns';

interface StreakDay {
  date: string;
  completed: number;
}

interface StreakCalendarProps {
  data: StreakDay[];
  currentStreak: number;
  bestStreak: number;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ data, currentStreak, bestStreak }) => {
  // Generate calendar days for the current month
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = data.find(d => d.date === dateStr);
    
    return {
      date,
      completed: dayData?.completed || 0,
      isCurrentMonth: date.getMonth() === today.getMonth(),
      isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    };
  });

  // Group days by weeks
  const weeks: typeof calendarDays[] = [];
  let currentWeek: typeof calendarDays = [];

  calendarDays.forEach(day => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Update the intensity class based on number of completed sessions
  const getIntensityClass = (completed: number) => {
    if (completed === 0) return 'bg-gray-100';
    if (completed < 2) return 'bg-red-100';
    if (completed < 4) return 'bg-red-200';
    if (completed < 6) return 'bg-red-300';
    if (completed < 8) return 'bg-red-400';
    return 'bg-red-500';
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
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <p className="text-2xl font-bold">
                {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Best Streak</p>
            <p className="text-2xl font-bold">
              {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
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
                    ${!day.isCurrentMonth ? 'opacity-25' : ''}
                    ${day.isToday ? 'ring-2 ring-pomodoro-work' : ''}
                  `}
                  title={`${format(day.date, 'MMM d')}: ${day.completed} sessions`}
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
