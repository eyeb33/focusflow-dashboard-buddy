
import { useAuth } from '@/contexts/AuthContext';
import { saveFocusSession } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';

interface SessionPersistenceParams {
  userId: string | undefined;
  timerMode: TimerMode;
  settings: TimerSettings;
  workDurationMinutes?: number;
}

export function useSessionPersistence() {
  const { user } = useAuth();
  
  const saveCompletedSession = async ({
    userId = user?.id,
    timerMode,
    settings,
    workDurationMinutes
  }: SessionPersistenceParams) => {
    if (!userId) return;
    
    console.log('Saving completed session:', { userId, timerMode });
    
    if (timerMode === 'work') {
      // Save work session and update stats
      const duration = workDurationMinutes || settings.workDuration;
      
      // Mark as completed=true for proper counting in dashboard
      await saveFocusSession(userId, timerMode, duration * 60, true);
      
      // Update daily stats to increment completed sessions count
      await updateDailyStats(userId, duration);
      
      console.log('Successfully saved completed work session');
    } else {
      // Save break session
      const duration = timerMode === 'break' 
        ? settings.breakDuration * 60 
        : settings.longBreakDuration * 60;
      
      await saveFocusSession(userId, timerMode, duration, true);
      console.log('Successfully saved completed break session');
    }
  };
  
  return { saveCompletedSession };
}
