
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveFocusSession } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';
import { playTimerCompletionSound } from '@/utils/audioUtils';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';

interface UseTimerCompletionProps {
  timerMode: TimerMode;
  settings: TimerSettings;
  completedSessions: number;
  setCompletedSessions: (sessions: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  setIsRunning: (isRunning: boolean) => void;
  setTotalTimeToday: (callback: (prev: number) => number) => void;
  setCurrentSessionIndex: (index: number) => void;
  resetTimerState: () => void;
}

export function useTimerCompletion({
  timerMode,
  settings,
  completedSessions,
  setCompletedSessions,
  setTimerMode,
  setIsRunning,
  setTotalTimeToday,
  setCurrentSessionIndex,
  resetTimerState
}: UseTimerCompletionProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleTimerComplete = () => {
    // Play sound when timer completes
    playTimerCompletionSound();

    if (timerMode === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalTimeToday(prev => prev + settings.workDuration);
      
      if (user) {
        saveFocusSession(user.id, timerMode, settings.workDuration * 60);
        updateDailyStats(user.id, settings.workDuration);
      }
      
      // After work session is completed, check if long break is needed
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setTimerMode('longBreak');
        // Update the current session index to match the completed session
        setCurrentSessionIndex(newCompletedSessions % settings.sessionsUntilLongBreak);
        toast({
          title: "Time for a long break!",
          description: `You've completed ${settings.sessionsUntilLongBreak} focus sessions. Take a longer break now.`,
        });
        // Automatically start the long break timer
        setTimeout(() => {
          setIsRunning(true);
        }, 50);
      } else {
        setTimerMode('break');
        // Update the current session index to match the completed session
        setCurrentSessionIndex(newCompletedSessions % settings.sessionsUntilLongBreak);
        toast({
          title: "Session completed!",
          description: `You completed a ${settings.workDuration} minute focus session.`,
        });
        // Automatically start the break timer
        setTimeout(() => {
          setIsRunning(true);
        }, 50);
      }
    } else {
      if (user) {
        const duration = timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
        const durationMinutes = timerMode === 'break' ? settings.breakDuration : settings.longBreakDuration;
        saveFocusSession(user.id, timerMode, duration);
        updateDailyStats(user.id, durationMinutes);
      }
      
      // After breaks, go back to work mode
      setTimerMode('work');
      
      // After a break, we should advance to the next focus session
      // ONLY if we just completed a break (not a long break)
      if (timerMode === 'break') {
        toast({
          title: "Break finished!",
          description: "Time to focus again.",
        });
        // Automatically start the next focus timer
        setTimeout(() => {
          setIsRunning(true);
        }, 50);
      } else if (timerMode === 'longBreak') {
        toast({
          title: "Long break finished!",
          description: "Ready to start a new cycle?",
        });
        // After a long break, reset the current session index to start a new cycle
        setCurrentSessionIndex(0);
        // Do NOT automatically start after a long break - it's the end of a complete cycle
      }
    }
    
    resetTimerState();
    setIsRunning(false);
  };

  return { handleTimerComplete };
}
