
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { getTotalTime } from '@/utils/timerContextUtils';
import { saveFocusSession } from '@/utils/timerStorage';
import { playTimerCompletionSound } from '@/utils/audioUtils'; 
import { updateDailyStats } from '@/utils/productivityStats';
import { TimerSettings } from './useTimerSettings';
import { useRef, useEffect } from 'react';

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
  const sessionStartTimeRef = useRef<string | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  
  // Update session start time when timer mode changes or when timer completes
  useEffect(() => {
    // Set the start time when a new mode is selected
    sessionStartTimeRef.current = new Date().toISOString();
  }, [timerMode]);
  
  // Handle timer completion
  const handleTimerComplete = async () => {
    try {
      // Prevent multiple rapid completions
      if (isTransitioningRef.current) {
        console.log("Already transitioning between modes - ignoring completion call");
        return;
      }
      
      isTransitioningRef.current = true;
      console.log(`Timer completion started for mode: ${timerMode}`);
      
      // Play completion sound with the current mode
      await playTimerCompletionSound(timerMode);
      
      // Get total time for this timer mode in seconds
      const totalTime = getTotalTime(timerMode, settings);
      
      // Get the session start time (or use current time as fallback)
      const sessionStartTime = sessionStartTimeRef.current || new Date().toISOString();
      
      if (timerMode === 'work') {
        // When a work session completes:
        // 1. Update the completed sessions counter
        // 2. Calculate next timer mode
        
        // Calculate minutes explicitly from settings (standard pomodoro time)
        const minutes = settings.workDuration; // This is already in minutes (typically 25)
        
        console.log(`Timer completed with ${minutes} minutes for work session`);
        
        // Track the session completion properly for the dashboard
        if (user) {
          // Save the completed session in the database with accurate duration and start time
          // This ensures the session is attributed to the day it started on
          await saveFocusSession(
            user.id, 
            timerMode, 
            totalTime, 
            true,
            sessionStartTime
          );
          
          // Update local state - increment completed sessions AFTER current session finishes
          const newCompletedSessions = completedSessions + 1;
          setCompletedSessions(newCompletedSessions);
          
          // Add the time to today's total (using settings time rather than arbitrary calculation)
          setTotalTimeToday(prev => prev + minutes);
          
          // Update daily stats (explicitly passing minutes)
          // We pass the start date to ensure it's attributed to the correct day
          const sessionStartDate = new Date(sessionStartTime).toISOString().split('T')[0];
          await updateDailyStats(user.id, minutes, timerMode, sessionStartDate);
        } else {
          // Even without a user, increment the completed sessions count
          setCompletedSessions(prev => prev + 1);
        }
        
        // After completing a work session, move to the next position in the cycle
        const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
        setCurrentSessionIndex(newSessionIndex);
        
        // Log the state transition
        console.log(`Work session completed. Moving from session ${currentSessionIndex} to ${newSessionIndex}`);
        console.log(`After completion: completed sessions=${completedSessions + 1}, currentSessionIndex=${newSessionIndex}`);
        
        // Reset the session start time for the next session
        sessionStartTimeRef.current = new Date().toISOString();
        
        // Determine if we should go to longBreak or regular break
        const nextMode: TimerMode = newSessionIndex === 0 ? 'longBreak' : 'break';
        setTimerMode(nextMode);
        
        // Reset timer state to initialize the new mode's time values
        resetTimerState();
      } 
      else if (timerMode === 'break') {
        // Break sessions don't increment the main session counter
        // But we still need to record them for analytics
        if (user) {
          await saveFocusSession(
            user.id, 
            timerMode, 
            totalTime, 
            true,
            sessionStartTime
          );
        }
        
        // Reset the session start time for the next session
        sessionStartTimeRef.current = new Date().toISOString();
        
        // IMPORTANT: After break, go back to work mode but keep the same currentSessionIndex
        // This is critical for correct display of indicator circles
        console.log(`Break session completed. Keeping session index at ${currentSessionIndex}`);
        setTimerMode('work');
        
        // Reset timer state to initialize the new mode's time values
        resetTimerState();
      } 
      else if (timerMode === 'longBreak') {
        if (user) {
          await saveFocusSession(
            user.id, 
            timerMode, 
            totalTime, 
            true,
            sessionStartTime
          );
        }
        
        // Reset the session start time for the next session
        sessionStartTimeRef.current = new Date().toISOString();
        
        // After a long break, we start a new cycle at position 0
        console.log('Long break completed - starting a new cycle');
        
        // Reset position to 0 for the new cycle
        setCurrentSessionIndex(0);
        setTimerMode('work');
        
        // Reset completed sessions counter when starting a new cycle
        setCompletedSessions(0); // Reset the count when a cycle completes
        
        // Reset timer state
        resetTimerState();
        
        // Exit early to prevent auto-start after long break
        isTransitioningRef.current = false;
        return;
      }
      
      // Give a slight delay before auto-starting to ensure UI updates and new timer is loaded
      setTimeout(() => {
        console.log(`Auto-starting next timer mode: ${timerMode === 'work' ? 'break' : 'work'}`);
        setIsRunning(true);
        isTransitioningRef.current = false;
      }, 1500); // Use a longer delay to ensure everything is properly initialized
      
    } catch (error) {
      console.error('Error handling timer completion:', error);
      // Don't change mode on error, just stop the timer
      setIsRunning(false);
      resetTimerState();
      isTransitioningRef.current = false;
    }
  };

  return { handleTimerComplete, sessionStartTimeRef };
}
