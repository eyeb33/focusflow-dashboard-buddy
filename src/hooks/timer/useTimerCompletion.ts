
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface TimerCompletionParams {
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  completedSessions: number;
  setCompletedSessions: (count: number) => void;
  totalTimeToday: number;
  setTotalTimeToday: (time: number) => void;
  currentSessionIndex: number;
  setCurrentSessionIndex: (index: number) => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  settings: TimerSettings;
  setTimeRemaining: (time: number) => void;
}

export function useTimerCompletion({
  timerMode,
  setTimerMode,
  setIsRunning,
  completedSessions,
  setCompletedSessions,
  totalTimeToday,
  setTotalTimeToday,
  currentSessionIndex,
  setCurrentSessionIndex,
  sessionStartTimeRef,
  pausedTimeRef,
  settings,
  setTimeRemaining
}: TimerCompletionParams) {
  
  const handleTimerComplete = useCallback(() => {
    console.log('Timer complete for mode:', timerMode);
    
    // Always stop the timer first
    setIsRunning(false);
    
    // Clear session start time and pause time
    sessionStartTimeRef.current = null;
    pausedTimeRef.current = null;
    
    if (timerMode === 'work') {
      // After work session
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Add to today's total time
      setTotalTimeToday(prev => prev + settings.workDuration);
      
      // Move to next session in cycle
      const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
      setCurrentSessionIndex(newSessionIndex);
      
      // Determine if we should take a long break
      const nextMode = newSessionIndex === 0 ? 'longBreak' : 'break';
      setTimerMode(nextMode);
      
      // Set time for the new mode
      const newTime = nextMode === 'break' ? 
        settings.breakDuration * 60 : settings.longBreakDuration * 60;
      setTimeRemaining(newTime);
      
      // Auto-start the break
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
    } else {
      // After any break, go back to work mode
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto-start only after short breaks
      if (timerMode === 'break') {
        setTimeout(() => {
          setIsRunning(true);
        }, 500);
      }
    }
  }, [
    timerMode,
    settings,
    completedSessions,
    currentSessionIndex,
    totalTimeToday,
    setCompletedSessions,
    setTimerMode,
    setIsRunning,
    setTotalTimeToday,
    setCurrentSessionIndex,
    setTimeRemaining,
    sessionStartTimeRef,
    pausedTimeRef
  ]);
  
  return {
    handleTimerComplete
  };
}
