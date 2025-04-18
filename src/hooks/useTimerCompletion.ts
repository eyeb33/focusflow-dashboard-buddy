
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

    // Calculate the total sessions in a full cycle (work + break for each, then replace last break with long break)
    const totalSessionsInCycle = settings.sessionsUntilLongBreak * 2;
    
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
      
      // Work sessions are even positions in the sequence (0, 2, 4, etc.)
      // Find the next position, which is current + 1 (to move to the break)
      const currentPos = currentSessionIndex === undefined ? 0 : currentSessionIndex;
      const nextPos = currentPos + 1;
      
      // Update the current session index
      setCurrentSessionIndex(nextPos);
      
      // Check if the next position is the last one in the cycle (which would be a long break)
      if (nextPos === totalSessionsInCycle - 1) {
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
      
      if (timerMode === 'break') {
        // After a short break, move to the next work session
        // Breaks are odd positions (1, 3, 5, etc.)
        const nextPos = currentSessionIndex + 1;
        setCurrentSessionIndex(nextPos);
      } else {
        // After a long break, reset to position 0 (start of new cycle)
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
