
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { useRef } from 'react';

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
  const isTransitioningRef = useRef<boolean>(false);
  const sessionStartTimeRef = useRef<string | null>(null);
  
  // Set session start time
  const setSessionStartTime = (time: string | null) => {
    sessionStartTimeRef.current = time;
    
    // Also save to localStorage for persistence across refreshes
    if (time) {
      localStorage.setItem('sessionStartTime', time);
    } else {
      localStorage.removeItem('sessionStartTime');
    }
  };
  
  // Function to save completed session
  const saveSession = async (
    timerMode: TimerMode,
    totalTime: number,
    sessionStartTime: string | null
  ): Promise<void> => {
    if (!user || !sessionStartTime) return;
    
    try {
      // For now, just log the session data
      console.log('Session completed:', {
        userId: user.id,
        timerMode,
        totalTime,
        completed: true,
        sessionStartTime
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };
  
  // Handle timer completion
  const handleTimerComplete = async () => {
    // Prevent multiple transitions
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    
    try {
      console.log('Timer complete for mode:', timerMode);
      
      // Get the session start time (or use current time as fallback)
      const sessionStartTime = sessionStartTimeRef.current || new Date().toISOString();
      
      // Always stop the timer first
      setIsRunning(false);
      
      // Different handling based on timer mode
      if (timerMode === 'work') {
        // After work session
        const newCompletedSessions = completedSessions + 1;
        setCompletedSessions(newCompletedSessions);
        
        // Add to today's total time
        setTotalTimeToday(prev => prev + settings.workDuration);
        
        // Save the completed session
        await saveSession('work', settings.workDuration * 60, sessionStartTime);
        
        // Move to next session in cycle
        const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
        setCurrentSessionIndex(newSessionIndex);
        
        // Determine if we should take a long break
        const nextMode = newSessionIndex === 0 ? 'longBreak' : 'break';
        setTimerMode(nextMode);
        
        // Auto-start the break after a slight delay
        setTimeout(() => {
          setIsRunning(true);
        }, 500);
      } else {
        // After a break
        if (timerMode === 'break') {
          await saveSession('break', settings.breakDuration * 60, sessionStartTime);
        } else {
          await saveSession('longBreak', settings.longBreakDuration * 60, sessionStartTime);
        }
        
        // Go back to work mode
        setTimerMode('work');
        
        // Auto-start only after short breaks
        if (timerMode === 'break') {
          setTimeout(() => {
            setIsRunning(true);
          }, 500);
        }
      }
    } finally {
      // Reset transition flag and session start time
      isTransitioningRef.current = false;
      sessionStartTimeRef.current = new Date().toISOString();
    }
  };

  return { handleTimerComplete, sessionStartTimeRef };
}
