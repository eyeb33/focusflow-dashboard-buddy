
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { saveFocusSession } from '@/utils/timerStorage';

interface UseTimerSessionPersistenceProps {
  user: any | null;
}

export function useTimerSessionPersistence({ user }: UseTimerSessionPersistenceProps) {
  const saveSession = async (
    timerMode: TimerMode,
    totalTime: number,
    sessionStartTime: string | null
  ): Promise<void> => {
    if (!user || !sessionStartTime) return;
    
    try {
      console.log('Saving session to Supabase:', {
        userId: user.id,
        timerMode,
        totalTime,
        completed: true,
        sessionStartTime
      });
      
      await saveFocusSession(
        user.id, 
        timerMode, 
        totalTime, 
        true,
        sessionStartTime
      );
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  return { saveSession };
}
