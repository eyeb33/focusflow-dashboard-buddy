
import { formatTime, getModeLabel } from './timerUtils';
import { saveFocusSession, fetchTodayStats } from './timerStorage';
import { updateDailyStats } from './productivityStats';
import { TimerSettings } from '@/hooks/useTimerSettings';

// Timer mode type
export type TimerMode = 'work' | 'break' | 'longBreak';

// Get total time based on timer mode
export const getTotalTime = (timerMode: TimerMode, settings: TimerSettings): number => {
  switch (timerMode) {
    case 'break':
      return settings.breakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
    case 'work':
    default:
      return settings.workDuration * 60;
  }
};

// Function to load today's timer stats
export const loadTodayStats = async (userId: string): Promise<{ 
  completedSessions: number;
  totalTimeToday: number;
}> => {
  const stats = await fetchTodayStats(userId);
  return {
    completedSessions: stats.completedSessions,
    totalTimeToday: stats.totalTimeToday,
  };
};

// Function to save a partial session
export const savePartialSession = async (
  userId: string, 
  timerMode: TimerMode, 
  totalTime: number, 
  timeRemaining: number,
  lastRecordedFullMinutes: number
): Promise<{
  newFullMinutes: number;
  minutesSaved: number;
}> => {
  const elapsedTime = totalTime - timeRemaining;
  const elapsedFullMinutes = Math.floor(elapsedTime / 60);
  const newFullMinutes = elapsedFullMinutes - lastRecordedFullMinutes;
  
  if (newFullMinutes > 0) {
    console.log(`Saving partial session with ${newFullMinutes} new complete minutes`);
    
    // Only save focus sessions for work mode
    if (timerMode === 'work') {
      await saveFocusSession(userId, timerMode, newFullMinutes * 60, false);
      await updateDailyStats(userId, newFullMinutes);
    }
  }
  
  return {
    newFullMinutes: elapsedFullMinutes,
    minutesSaved: newFullMinutes
  };
};
