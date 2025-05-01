
import { useCallback, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { saveFocusSession } from '@/utils/timerStorage';
import { playTimerCompletionSound } from '@/utils/audioUtils';

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
  const { user } = useAuth();
  const isCompletingCycleRef = useRef(false);
  
  // Timer completion handler
  const handleTimerComplete = useCallback(() => {
    // Prevent multiple completions
    if (isCompletingCycleRef.current) {
      console.log("Already handling completion - skipping");
      return;
    }
    
    isCompletingCycleRef.current = true;
    
    try {
      const currentMode = timerMode;
      
      console.log("Timer completed with mode:", currentMode);
      toast.success(`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} session completed!`);
      
      // Play completion sound
      playTimerCompletionSound(currentMode);
      
      // Stop the timer
      setIsRunning(false);
      
      // Save session data if user is logged in
      if (user && sessionStartTimeRef.current) {
        const sessionDuration = currentMode === 'work' 
          ? settings.workDuration * 60
          : currentMode === 'break'
            ? settings.breakDuration * 60
            : settings.longBreakDuration * 60;
            
        saveFocusSession(
          user.id,
          currentMode,
          sessionDuration,
          true,
          sessionStartTimeRef.current
        ).then(() => {
          console.log(`Session saved to database: ${currentMode} - ${sessionDuration} seconds`);
        }).catch(err => {
          console.error("Error saving session:", err);
        });
      }
      
      if (currentMode === 'work') {
        // Increment completed sessions counter
        setCompletedSessions(prev => prev + 1);
        
        // Add work time to total time for today
        const workSeconds = settings.workDuration * 60;
        setTotalTimeToday(prev => prev + workSeconds);
        
        // Calculate next session index
        const nextIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
        setCurrentSessionIndex(nextIndex);
        
        console.log(`Work session completed. Moving from session ${currentSessionIndex} to ${nextIndex}`);
        
        // Determine if it's time for a long break
        const nextMode = nextIndex === 0 ? 'longBreak' : 'break';
        setTimerMode(nextMode);
        
        // Set a new session start time
        setSessionStartTime(new Date().toISOString());
        
        // Reset timer state with correct mode
        resetTimerState();
        
        // Auto-start next session
        setTimeout(() => setIsRunning(true), 500);
      } else {
        // After any break, return to work mode
        setTimerMode('work');
        
        // Set a new session start time
        setSessionStartTime(new Date().toISOString());
        
        // Reset timer state
        resetTimerState();
        
        // For long break, reset the cycle and don't auto-start
        if (currentMode === 'longBreak') {
          setIsRunning(false);
          setCurrentSessionIndex(0);
          setCompletedSessions(0); // Reset completed sessions counter for new cycle
        } else {
          // Auto-start after short break
          setTimeout(() => setIsRunning(true), 500);
        }
      }
    } finally {
      // Reset completion flag
      isCompletingCycleRef.current = false;
    }
  }, [timerMode, settings, currentSessionIndex, completedSessions, user, sessionStartTimeRef, 
      setCompletedSessions, setIsRunning, setTimerMode, setCurrentSessionIndex, setTotalTimeToday, 
      setSessionStartTime, resetTimerState]);
  
  return { handleTimerComplete };
}
