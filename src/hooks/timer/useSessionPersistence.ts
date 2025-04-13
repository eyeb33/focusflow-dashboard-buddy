
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
    if (!userId) {
      console.error('Cannot save session: No user ID provided');
      return;
    }
    
    console.log(`Saving completed session for user ${userId}, mode: ${timerMode}`);
    
    if (timerMode === 'work') {
      // Save work session and update stats
      const duration = workDurationMinutes || settings.workDuration;
      
      try {
        // Mark as completed=true for proper counting in dashboard
        const sessionSaved = await saveFocusSession(userId, timerMode, duration * 60, true);
        if (!sessionSaved) {
          console.error('Failed to save focus session');
          return;
        }
        
        // Update daily stats to increment completed sessions count
        const statsUpdated = await updateDailyStats(userId, duration);
        if (!statsUpdated) {
          console.error('Failed to update daily stats');
          return;
        }
        
        console.log(`Successfully saved completed work session (${duration} minutes)`);
      } catch (error) {
        console.error('Error saving completed session:', error);
      }
    } else {
      // Save break session
      try {
        const duration = timerMode === 'break' 
          ? settings.breakDuration * 60 
          : settings.longBreakDuration * 60;
        
        const sessionSaved = await saveFocusSession(userId, timerMode, duration, true);
        if (!sessionSaved) {
          console.error('Failed to save break session');
          return;
        }
        console.log(`Successfully saved completed ${timerMode} session`);
      } catch (error) {
        console.error('Error saving break session:', error);
      }
    }
  };
  
  return { saveCompletedSession };
}
