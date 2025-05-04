import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';
import { updateDailyStats } from '@/utils/productivityStats';
import { playTimerCompletionSound } from '@/utils/audioUtils';

interface UseTimerCycleManagerProps {
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
  saveSession: (timerMode: TimerMode, totalTime: number, sessionStartTime: string | null) => Promise<void>;
}

export function useTimerCycleManager({
  timerMode,
  settings,
  completedSessions,
  currentSessionIndex,
  setCompletedSessions,
  setTimerMode,
  setIsRunning,
  setTotalTimeToday,
  setCurrentSessionIndex,
  resetTimerState,
  saveSession
}: UseTimerCycleManagerProps) {
  
  const handleWorkCompletion = useCallback(async (
    userId: string | undefined, 
    sessionStartTime: string | null
  ) => {
    // Calculate minutes from settings
    const minutes = settings.workDuration;
    
    console.log(`Work session completed with ${minutes} minutes`);
    
    if (userId) {
      // Save the completed session
      const totalTime = settings.workDuration * 60;
      await saveSession(timerMode, totalTime, sessionStartTime);
      
      // Update daily stats with the completed session
      if (sessionStartTime) {
        const sessionStartDate = new Date(sessionStartTime).toISOString().split('T')[0];
        await updateDailyStats(userId, minutes, timerMode, sessionStartDate);
      }
    }
    
    // Always increment completed sessions after a work session
    setCompletedSessions(prev => prev + 1);
    
    // Add time to today's total
    setTotalTimeToday(prev => prev + minutes);
    
    // After completing a work session, move to the next position in the cycle
    const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
    setCurrentSessionIndex(newSessionIndex);
    
    console.log(`Work session completed. Moving from session ${currentSessionIndex} to ${newSessionIndex}`);
    console.log(`After completion: completed sessions=${completedSessions + 1}, currentSessionIndex=${newSessionIndex}`);
    
    // Determine if we should go to longBreak or regular break
    const shouldGoToLongBreak = (completedSessions + 1) % settings.sessionsUntilLongBreak === 0 &&
                                (completedSessions + 1) > 0;
    const nextMode: TimerMode = shouldGoToLongBreak ? 'longBreak' : 'break';
    
    setTimerMode(nextMode);
    
    // Reset timer state to initialize the new mode's time values
    resetTimerState();
    
    // Give a slight delay before auto-starting to ensure UI updates
    setTimeout(() => {
      console.log(`Auto-starting next timer mode: ${nextMode}`);
      setIsRunning(true);
    }, 1000);
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
    resetTimerState, 
    saveSession
  ]);

  const handleBreakCompletion = useCallback(async (
    userId: string | undefined, 
    sessionStartTime: string | null
  ) => {
    if (userId) {
      // Save the completed session
      const totalTime = settings.breakDuration * 60;
      await saveSession(timerMode, totalTime, sessionStartTime);
    }
    
    // After break, go back to work mode but keep the currentSessionIndex
    console.log(`Break session completed. Session index remains at ${currentSessionIndex}`);
    setTimerMode('work');
    
    // Reset timer state to initialize the new mode's time values
    resetTimerState();
    
    // Give a slight delay before auto-starting to ensure UI updates
    setTimeout(() => {
      console.log(`Auto-starting next work session after break`);
      setIsRunning(true);
    }, 1000);
  }, [
    timerMode, 
    settings, 
    currentSessionIndex, 
    setTimerMode, 
    setIsRunning, 
    resetTimerState, 
    saveSession
  ]);

  const handleLongBreakCompletion = useCallback(async (
    userId: string | undefined, 
    sessionStartTime: string | null
  ) => {
    if (userId) {
      // Save the completed session
      const totalTime = settings.longBreakDuration * 60;
      await saveSession(timerMode, totalTime, sessionStartTime);
    }
    
    console.log('Long break completed - starting a new cycle');
    
    // Reset position to 0 for the new cycle
    setCurrentSessionIndex(0);
    
    // Reset completed sessions counter when starting a new cycle
    setCompletedSessions(0);
    
    // After long break, go back to work mode
    setTimerMode('work');
    
    // Reset timer state to initialize the new mode's time values
    resetTimerState();
    
    // Do NOT auto-start after a long break - wait for user action
    setIsRunning(false);
  }, [
    timerMode, 
    settings, 
    setCompletedSessions, 
    setTimerMode, 
    setIsRunning, 
    setCurrentSessionIndex, 
    resetTimerState, 
    saveSession
  ]);

  return {
    handleWorkCompletion,
    handleBreakCompletion,
    handleLongBreakCompletion
  };
}
