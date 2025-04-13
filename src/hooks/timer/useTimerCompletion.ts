
import { useAuth } from '@/contexts/AuthContext';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';
import { useSessionPersistence } from './useSessionPersistence';
import { useTimerNotifications } from './useTimerNotifications';
import { useNextTimerMode } from './useNextTimerMode';

interface TimerCompletionParams {
  timerMode: TimerMode;
  completedSessions: number;
  settings: TimerSettings;
  setCompletedSessions: (value: React.SetStateAction<number>) => void;
  setTotalTimeToday: (value: React.SetStateAction<number>) => void;
  setTimerMode: (mode: TimerMode) => void;
  setTimeRemaining: (time: React.SetStateAction<number>) => void;
  setIsRunning: (value: React.SetStateAction<boolean>) => void;
}

export function useTimerCompletion({
  timerMode,
  completedSessions,
  settings,
  setCompletedSessions,
  setTotalTimeToday,
  setTimerMode,
  setTimeRemaining,
  setIsRunning
}: TimerCompletionParams) {
  const { user } = useAuth();
  const { saveCompletedSession } = useSessionPersistence();
  const { showCompletionNotification } = useTimerNotifications();
  const { determineNextMode } = useNextTimerMode();

  const handleTimerComplete = async () => {
    console.log(`Timer completed for mode: ${timerMode}`);
    setIsRunning(false);
    
    // For work sessions, increment session count and update stats
    if (timerMode === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Update total focus time in minutes
      const workDurationMinutes = settings.workDuration;
      setTotalTimeToday(prev => prev + workDurationMinutes);
      
      // Save completed session to Supabase
      if (user) {
        console.log('Saving completed work session');
        await saveCompletedSession({
          userId: user.id,
          timerMode,
          settings,
          workDurationMinutes
        });
      }
      
    } else if (user) {
      // For break sessions
      await saveCompletedSession({
        userId: user.id,
        timerMode,
        settings
      });
    }
    
    // Determine next timer mode and duration
    const { nextMode, nextDuration } = determineNextMode({
      timerMode,
      completedSessions: timerMode === 'work' ? completedSessions + 1 : completedSessions,
      settings
    });
    
    // Set next timer mode and duration
    setTimerMode(nextMode);
    setTimeRemaining(nextDuration);
    
    // Show notification to user
    showCompletionNotification({
      timerMode,
      settings,
      completedSessions
    });
    
    // Auto-start the next timer
    setTimeout(() => {
      setIsRunning(true);
    }, 500);
  };

  return { handleTimerComplete };
}
