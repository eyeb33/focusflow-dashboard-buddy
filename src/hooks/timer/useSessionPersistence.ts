
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
      await saveFocusSession(userId, timerMode, duration * 60, true);
      await updateDailyStats(userId, duration);
    } else {
      // Save break session
      const duration = timerMode === 'break' 
        ? settings.breakDuration * 60 
        : settings.longBreakDuration * 60;
      
      await saveFocusSession(userId, timerMode, duration, true);
    }
  };
  
  return { saveCompletedSession };
}
