
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStats } from '@/hooks/useTaskStats';
import { playTimerCompletionSound } from '@/utils/audioUtils';
import { TimerMode } from '@/utils/timerContextUtils';
import { toast } from 'sonner';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  showNotifications: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  soundId: string;
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
    
    // Show completion notification
    const modeLabel = timerMode === 'work' ? 'Focus' : 
                      timerMode === 'break' ? 'Break' : 'Long Break';
    toast.success(`${modeLabel} session completed!`);
    
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
      const newTotalTime = totalTimeToday + settings.workDuration * 60;
      setTotalTimeToday(newTotalTime);
      
      // Persist work session
      handleWorkCompletion(user?.id, sessionStartTime);
      
      // Increment session index for tracking progress toward long break
      const nextSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
      setCurrentSessionIndex(nextSessionIndex);
      
      // Check if it's time for a long break
      // Only transition to long break after completing the full cycle
      if (nextSessionIndex === 0) {
        setTimerMode('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
        console.log("Transitioning to long break after completing focus cycle");
      } else {
        setTimerMode('break');
        setTimeRemaining(settings.breakDuration * 60);
        console.log("Transitioning to short break");
      }
      
      // Always auto-start breaks
      setTimeout(() => {
        setIsRunning(true);
        sessionStartTimeRef.current = new Date().toISOString();
        console.log("Auto-starting break session");
      }, 300);
      
    } else if (timerMode === 'break') {
      // After short break, always go back to focus mode
      // Update total time today
      const newTotalTime = totalTimeToday + settings.breakDuration * 60;
      setTotalTimeToday(newTotalTime);
      
      // Persist break session
      handleBreakCompletion(user?.id, sessionStartTime);
      
      // Return to focus mode
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto-start next focus session
      setTimeout(() => {
        setIsRunning(true);
        sessionStartTimeRef.current = new Date().toISOString();
        console.log("Auto-starting next focus session after break");
      }, 300);
      
    } else if (timerMode === 'longBreak') {
      // After long break, return to focus mode but don't auto-start
      // Update total time today
      const newTotalTime = totalTimeToday + settings.longBreakDuration * 60;
      setTotalTimeToday(newTotalTime);
      
      // Persist long break session
      handleLongBreakCompletion(user?.id, sessionStartTime);
      
      // Return to focus mode
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      console.log("Long break completed. Focus session ready but not auto-started.");
      
      // Do NOT auto-start after long break
      // User needs to manually start the next work session
      toast.info("Long break completed! Start your next focus session when ready.");
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
