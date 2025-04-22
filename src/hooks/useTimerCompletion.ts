import { useAuth } from '@/contexts/AuthContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { getTotalTime } from '@/utils/timerContextUtils';
import { saveFocusSession } from '@/utils/timerStorage';
import { playTimerCompletionSound } from '@/utils/audioUtils'; 
import { updateDailyStats } from '@/utils/productivityStats';
import { TimerSettings } from './useTimerSettings';

interface UseTimerCompletionProps {
  timerMode: TimerMode;
  settings: TimerSettings;
  completedSessions: number;
  currentSessionIndex: number;
  setCompletedSessions: React.Dispatch<React.SetStateAction<number>>;
  setTimerMode: React.Dispatch<React.SetStateAction<TimerMode>>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalTimeToday: React.Dispatch<React.SetStateAction<number>>;
  setCurrentSessionIndex: React.Dispatch<React.SetStateAction<number>>;
  resetTimerState: () => void;
}

export function useTimerCompletion({
  timerMode,
  settings,
  completedSessions,
  currentSessionIndex,
  setCompletedSessions,
  setTimerMode,
  setIsRunning,
  setTotalTimeToday,
  setCurrentSessionIndex,
  resetTimerState
}: UseTimerCompletionProps) {
  const { user } = useAuth();
  
  // Handle timer completion
  const handleTimerComplete = async () => {
    try {
      // Play completion sound
      await playTimerCompletionSound();
      
      // Get total time for this timer mode in seconds
      const totalTime = getTotalTime(timerMode, settings);
      
      if (timerMode === 'work') {
        // When a work session completes:
        // 1. Update the completed sessions counter
        // 2. Calculate next timer mode
        
        // Calculate minutes explicitly from settings (standard pomodoro time)
        const minutes = settings.workDuration; // This is already in minutes (typically 25)
        
        console.log(`Timer completed with ${minutes} minutes for work session`);
        
        // Track the session completion properly for the dashboard
        if (user) {
          // Save the completed session in the database with accurate duration
          await saveFocusSession(user.id, timerMode, totalTime, true);
          
          // Update local state
          setCompletedSessions(prev => prev + 1);
          
          // Add the time to today's total (using settings time rather than arbitrary calculation)
          setTotalTimeToday(prev => prev + minutes);
          
          // Update daily stats (explicitly passing minutes)
          await updateDailyStats(user.id, minutes, timerMode);
        }
        
        // After completing a work session, move to the next position in the cycle
        const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
        setCurrentSessionIndex(newSessionIndex);
        
        // Log the state transition
        console.log(`Work session completed. Moving from session ${currentSessionIndex} to ${newSessionIndex}`);
        console.log(`After completion: completed sessions=${completedSessions + 1}, currentSessionIndex=${newSessionIndex}`);
        
        // Determine if we should go to longBreak or regular break
        const nextMode: TimerMode = newSessionIndex === 0 ? 'longBreak' : 'break';
        setTimerMode(nextMode);
      } 
      else if (timerMode === 'break') {
        // Break sessions don't increment the main session counter
        // But we still need to record them for analytics
        if (user) {
          await saveFocusSession(user.id, timerMode, totalTime, true);
        }
        
        // After break, go back to work mode but keep the same currentSessionIndex
        console.log(`Break session completed. Keeping session index at ${currentSessionIndex}`);
        setTimerMode('work');
      } 
      else if (timerMode === 'longBreak') {
        if (user) {
          await saveFocusSession(user.id, timerMode, totalTime, true);
        }
        
        // After a long break, we start a new cycle at position 0
        console.log('Long break completed - starting a new cycle');
        
        // Reset position to 0 for the new cycle
        setCurrentSessionIndex(0);
        setTimerMode('work');
        
        // Don't auto-start after a full cycle
        resetTimerState();
        return; // Exit early to prevent auto-start
      }
      
      // Reset timer state before the next session starts
      resetTimerState();
      
      // Auto-start the next timer (except after a full cycle, which we handled above)
      setTimeout(() => {
        setIsRunning(true);
      }, 1000); // Small delay before starting the next timer
    } catch (error) {
      console.error('Error handling timer completion:', error);
      // Set a safe mode if something went wrong
      setTimerMode('work');
      setIsRunning(false);
      resetTimerState();
    }
  };

  return { handleTimerComplete };
}
