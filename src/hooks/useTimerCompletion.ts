
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
      // Completed a work session
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalTimeToday(prev => prev + settings.workDuration);
      
      // Save completed work session to database
      if (user) {
        // Convert minutes to seconds for the database
        saveFocusSession(user.id, timerMode, settings.workDuration * 60);
        updateDailyStats(user.id, settings.workDuration, timerMode);
      }
      
      // Update the current session index
      const newSessionIndex = (timerMode === 'work') ? 
        Math.min(settings.sessionsUntilLongBreak * 2, completedSessions * 2 + 1) : 
        completedSessions * 2;
      setCurrentSessionIndex(newSessionIndex);
      
      // Check if we need a long break after completing the focus sessions goal
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setTimerMode('longBreak');
        toast({
          title: "Time for a long break!",
          description: `You've completed ${settings.sessionsUntilLongBreak} focus sessions. Take a longer break now.`,
        });
      } else {
        setTimerMode('break');
        toast({
          title: "Session completed!",
          description: `You completed a ${settings.workDuration} minute focus session.`,
        });
      }
      
      // Automatically start the break timer
      setTimeout(() => {
        setIsRunning(true);
      }, 50);
    } else {
      // Completed a break or long break session
      if (user) {
        const duration = timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
        const durationMinutes = timerMode === 'break' ? settings.breakDuration : settings.longBreakDuration;
        saveFocusSession(user.id, timerMode, duration);
        updateDailyStats(user.id, durationMinutes, timerMode);
      }
      
      // Update session index when completing a break
      if (timerMode === 'break') {
        const newSessionIndex = completedSessions * 2;
        setCurrentSessionIndex(newSessionIndex);
      } else {
        // After a long break, reset session index
        setCurrentSessionIndex(0);
      }
      
      // After breaks, go back to work mode
      setTimerMode('work');
      
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
        // After a long break, we're already at index 0
        // Do NOT automatically start after a long break - it's the end of a complete cycle
      }
    }
    
    resetTimerState();
    setIsRunning(false);
  };

  return { handleTimerComplete };
}
