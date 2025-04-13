
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveFocusSession } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';

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
  const { toast } = useToast();

  const handleTimerComplete = async () => {
    console.log(`Timer completed for mode: ${timerMode}`);
    setIsRunning(false);
    
    if (timerMode === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Update total focus time in minutes
      const workDurationMinutes = settings.workDuration;
      setTotalTimeToday(prev => prev + workDurationMinutes);
      
      // Save completed session to Supabase
      if (user) {
        console.log('Saving completed work session');
        await saveFocusSession(user.id, timerMode, settings.workDuration * 60, true);
        await updateDailyStats(user.id, settings.workDuration);
      }
      
      // Determine next break type and automatically transition
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setTimerMode('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
      } else {
        setTimerMode('break');
        setTimeRemaining(settings.breakDuration * 60);
      }
      
      // Auto-start the break timer
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
      
      // Show toast for completed work session
      toast({
        title: "Session completed!",
        description: `You completed a ${settings.workDuration} minute focus session.`,
      });
    } else {
      // For break sessions
      if (user) {
        const duration = timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
        console.log(`Saving completed ${timerMode} session`);
        await saveFocusSession(user.id, timerMode, duration, true);
        // We don't count break time in productivity stats, but still track them
      }
      
      // Automatically transition to work mode
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto-start the next work session
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
      
      // Show toast for completed break
      toast({
        title: timerMode === 'break' ? "Break completed!" : "Long break completed!",
        description: "Starting your next focus session.",
      });
    }
  };

  return { handleTimerComplete };
}
