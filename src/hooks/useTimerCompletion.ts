
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { getTotalTime } from '@/utils/timerContextUtils';
import { saveFocusSession } from '@/utils/timerStorage';
import { playTimerCompletionSound } from '@/utils/audioUtils'; // Fixed import name
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
      
      // Record the completed session
      if (user && timerMode === 'work') {
        // Calculate minutes explicitly from settings (standard pomodoro time)
        const minutes = settings.workDuration; // This is already in minutes (typically 25)
        
        console.log(`Timer completed with ${minutes} minutes for work session`);
        
        // Save the completed session in the database with accurate duration
        await saveFocusSession(user.id, timerMode, totalTime, true);
        
        // Update local state
        setCompletedSessions(prev => prev + 1);
        
        // Add the time to today's total (using settings time rather than arbitrary calculation)
        setTotalTimeToday(prev => prev + minutes);
        
        // Update daily stats (explicitly passing minutes)
        await updateDailyStats(user.id, minutes, timerMode);
      }
      
      // Reset timer mode based on current state and settings
      let newMode: TimerMode = 'work';
      let newCurrentSessionIndex = currentSessionIndex;
      
      if (timerMode === 'work') {
        // After work session, switch to break or long break
        newCurrentSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
        setCurrentSessionIndex(newCurrentSessionIndex);
        
        newMode = newCurrentSessionIndex === 0 ? 'longBreak' : 'break';
      } else {
        // After any break, switch back to work
        newMode = 'work';
      }
      
      // Stop the timer and set the new mode
      setIsRunning(false);
      setTimerMode(newMode);
      resetTimerState();
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
