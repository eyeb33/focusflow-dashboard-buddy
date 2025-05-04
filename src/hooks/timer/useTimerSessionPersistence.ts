
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
