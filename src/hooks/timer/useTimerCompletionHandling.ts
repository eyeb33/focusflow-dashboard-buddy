
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { getTotalTime } from '@/utils/timerContextUtils';
import { playTimerCompletionSound } from '@/utils/audioUtils';

interface UseTimerCompletionHandlingProps {
  timerMode: TimerMode;
  settings: any;
  isTransitioning: React.MutableRefObject<boolean>;
  handleWorkCompletion: (userId: string | undefined, sessionStartTime: string | null) => Promise<void>;
  handleBreakCompletion: (userId: string | undefined, sessionStartTime: string | null) => Promise<void>;
  handleLongBreakCompletion: (userId: string | undefined, sessionStartTime: string | null) => Promise<void>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  resetTimerState: () => void;
}

export function useTimerCompletionHandling({
  timerMode,
  settings,
  isTransitioning,
  handleWorkCompletion,
  handleBreakCompletion,
  handleLongBreakCompletion,
  setIsRunning,
  resetTimerState
}: UseTimerCompletionHandlingProps) {
  
  const handleCompletion = useCallback(async (
    userId: string | undefined, 
    sessionStartTime: string | null
  ) => {
    try {
      // Prevent multiple rapid completions
      if (isTransitioning.current) {
        console.log("Already transitioning between modes - ignoring completion call");
        return;
      }
      
      isTransitioning.current = true;
      console.log(`Timer completion started for mode: ${timerMode}, userId: ${userId ? 'logged-in' : 'not logged-in'}`);
      
      // Play completion sound with the current mode
      await playTimerCompletionSound(timerMode);
      
      // Get total time for this timer mode in seconds
      const totalTime = getTotalTime(timerMode, settings);
      console.log(`Total time for completed ${timerMode} session: ${totalTime} seconds`);
      
      // Handle completion based on the current timer mode
      if (timerMode === 'work') {
        console.log(`Completing work session with userId: ${userId ? userId : 'none'}, startTime: ${sessionStartTime}`);
        await handleWorkCompletion(userId, sessionStartTime);
      } 
      else if (timerMode === 'break') {
        await handleBreakCompletion(userId, sessionStartTime);
      } 
      else if (timerMode === 'longBreak') {
        await handleLongBreakCompletion(userId, sessionStartTime);
      }
      
      isTransitioning.current = false;
    } catch (error) {
      console.error('Error handling timer completion:', error);
      // Don't change mode on error, just stop the timer
      setIsRunning(false);
      resetTimerState();
      isTransitioning.current = false;
    }
  }, [
    timerMode, 
    settings, 
    isTransitioning,
    handleWorkCompletion,
    handleBreakCompletion,
    handleLongBreakCompletion,
    setIsRunning,
    resetTimerState
  ]);

  return { handleCompletion };
}
