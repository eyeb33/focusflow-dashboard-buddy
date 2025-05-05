
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { useRef } from 'react';
import { useTimerSessionPersistence } from './timer/useTimerSessionPersistence';

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
  
  // Initialize session persistence hook
  const { saveSession } = useTimerSessionPersistence({ user });
  
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
        if (user) {
          console.log(`Saving work session for user ${user.id} with duration ${settings.workDuration * 60} seconds`);
          await saveSession('work', settings.workDuration * 60, sessionStartTime);
        } else {
          console.log('No user logged in, skipping session save');
        }
        
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
        if (user) {
          if (timerMode === 'break') {
            await saveSession('break', settings.breakDuration * 60, sessionStartTime);
          } else {
            await saveSession('longBreak', settings.longBreakDuration * 60, sessionStartTime);
          }
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
      // Reset transition flag and set a new session start time
      isTransitioningRef.current = false;
      sessionStartTimeRef.current = new Date().toISOString();
    }
  };

  return { 
    handleTimerComplete, 
    sessionStartTimeRef,
    setSessionStartTime 
  };
}
