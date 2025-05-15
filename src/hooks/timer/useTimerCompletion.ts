
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStats } from '@/hooks/useTaskStats';
import { playTimerCompletionSound } from '@/utils/audioUtils';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks?: boolean;
  autoStartFocus?: boolean;
}

interface UseTimerCompletionProps {
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  isRunning: boolean;
  setIsRunning: (isRunning: boolean) => void;
  completedSessions: number;
  setCompletedSessions: (sessions: number) => void;
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
  isRunning,
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
}: UseTimerCompletionProps) {
  const { user } = useAuth();
  const { handleWorkCompletion, handleBreakCompletion, handleLongBreakCompletion } = useTaskStats();
  
  const handleTimerComplete = useCallback(() => {
    // Stop the timer if it's running
    if (isRunning) {
      setIsRunning(false);
    }
    
    console.log(`Timer completed for mode: ${timerMode} with ${totalTimeToday} total time today`);
    
    try {
      // Play the completion sound based on the current mode
      playTimerCompletionSound(timerMode);
    } catch (e) {
      console.error('Failed to play timer completion sound:', e);
    }
    
    // Persist session start time
    const sessionStartTime = sessionStartTimeRef.current;
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    
    // Handle completion based on the current timer mode
    if (timerMode === 'work') {
      // Increment completed sessions counter after focus session
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Update total time today
      setTotalTimeToday(prevTotalTime => prevTotalTime + settings.workDuration * 60);
      
      // Persist work session
      handleWorkCompletion(user?.id, sessionStartTime);
      
      // Check if it's time for a long break
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setTimerMode('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
        
        // Auto-start breaks if enabled in settings
        if (settings.autoStartBreaks) {
          // Set a small timeout to make sure UI updates first
          setTimeout(() => {
            setIsRunning(true);
            sessionStartTimeRef.current = new Date().toISOString();
          }, 100);
        }
      } else {
        setTimerMode('break');
        setTimeRemaining(settings.breakDuration * 60);
        
        // Auto-start breaks if enabled in settings
        if (settings.autoStartBreaks) {
          // Set a small timeout to make sure UI updates first
          setTimeout(() => {
            setIsRunning(true);
            sessionStartTimeRef.current = new Date().toISOString();
          }, 100);
        }
      }
      
      // Update current session index
      setCurrentSessionIndex(prevIndex => prevIndex + 1);
    } else if (timerMode === 'break') {
      // Update total time today
      setTotalTimeToday(prevTotalTime => prevTotalTime + settings.breakDuration * 60);
      
      // Persist break session
      handleBreakCompletion(user?.id, sessionStartTime);
      
      // After any break, return to focus mode
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto-start focus if enabled in settings
      if (settings.autoStartFocus) {
        // Set a small timeout to make sure UI updates first
        setTimeout(() => {
          setIsRunning(true);
          sessionStartTimeRef.current = new Date().toISOString();
        }, 100);
      }
    } else if (timerMode === 'longBreak') {
      // Update total time today
      setTotalTimeToday(prevTotalTime => prevTotalTime + settings.longBreakDuration * 60);
      
      // Persist long break session
      handleLongBreakCompletion(user?.id, sessionStartTime);
      
      // After any break, return to focus mode
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Long break completed - don't auto-start the next focus session
      // User needs to manually start the next work session after a long break
    }
  }, [
    timerMode,
    setTimerMode,
    isRunning,
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
    user,
    handleWorkCompletion,
    handleBreakCompletion, 
    handleLongBreakCompletion,
    setTimeRemaining
  ]);
  
  return { handleTimerComplete };
}
