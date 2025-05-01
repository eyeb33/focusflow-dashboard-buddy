import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';
import { toast } from 'sonner';

interface UseTimerCompletionHandlerProps {
  timerMode: TimerMode;
  settings: TimerSettings;
  completedSessions: number;
  currentSessionIndex: number;
  setCompletedSessions: React.Dispatch<React.SetStateAction<number>>;
  setTimerMode: React.Dispatch<React.SetStateAction<TimerMode>>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalTimeToday: React.Dispatch<React.SetStateAction<number>>;
  setCurrentSessionIndex: React.Dispatch<React.SetStateAction<number>>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  setSessionStartTime: (time: string | null) => void;
  resetTimerState: () => void;
}

export function useTimerCompletionHandler({
  timerMode,
  settings,
  completedSessions,
  currentSessionIndex,
  setCompletedSessions,
  setTimerMode,
  setIsRunning,
  setTotalTimeToday,
  setCurrentSessionIndex,
  sessionStartTimeRef,
  setSessionStartTime,
  resetTimerState
}: UseTimerCompletionHandlerProps) {

  const handleTimerComplete = useCallback(async () => {
    // Play notification sound or show toast based on current mode
    const modeLabel = timerMode === 'work' ? 'Focus' : 
                     timerMode === 'break' ? 'Break' : 'Long Break';
    toast.success(`${modeLabel} session completed!`);
    
    console.log(`Timer completed for mode: ${timerMode}`);
    console.log(`Current session index: ${currentSessionIndex}, completed sessions: ${completedSessions}`);
    
    // Reset the session start time for the next session
    setSessionStartTime(new Date().toISOString());
    
    if (timerMode === 'work') {
      // Update completed session count
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Add time to today's total
      setTotalTimeToday(prev => prev + settings.workDuration);
      
      // Update session index (the position in the current cycle)
      const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
      setCurrentSessionIndex(newSessionIndex);
      
      console.log(`Completed focus session. Moving to session index ${newSessionIndex}`);
      
      // Determine if it's time for a long break or regular break
      const nextMode: TimerMode = 
        newSessionIndex === 0 ? 'longBreak' : 'break';
        
      setTimerMode(nextMode);
      resetTimerState();
      
      // Auto-start the break
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
      
    } else if (timerMode === 'break') {
      // After a break, go back to focus mode but keep the current session index
      setTimerMode('work');
      resetTimerState();
      
      // Auto-start the next focus session
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
      
    } else if (timerMode === 'longBreak') {
      // After a long break, go back to focus mode and reset the session index
      console.log('Long break completed - starting a new cycle');
      setCurrentSessionIndex(0);
      setTimerMode('work');
      resetTimerState();
      
      // Do NOT auto-start after a long break - wait for user action
      setIsRunning(false);
    }
  }, [
    timerMode, 
    settings,
    completedSessions,
    currentSessionIndex,
    setCompletedSessions, 
    setTimerMode, 
    setIsRunning,
    setTotalTimeToday,
    setCurrentSessionIndex,
    sessionStartTimeRef,
    setSessionStartTime,
    resetTimerState
  ]);

  return { handleTimerComplete };
}
