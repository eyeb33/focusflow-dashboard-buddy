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
        // 1. Save the session data
        // 2. Increment completed sessions
        // 3. Move to the next position
        // 4. Transition to the appropriate break type
        
        // Calculate minutes from settings
        const minutes = settings.workDuration;
        
        console.log(`Work session completed with ${minutes} minutes`);
        
        if (user) {
          // Save the completed session with accurate duration and start time
          await saveFocusSession(
            user.id, 
            timerMode, 
            totalTime, 
            true,
            sessionStartTime
          );
          
          // Update daily stats with the completed session
          const sessionStartDate = new Date(sessionStartTime).toISOString().split('T')[0];
          await updateDailyStats(user.id, minutes, timerMode, sessionStartDate);
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
        
        // Reset the session start time for the next session
        sessionStartTimeRef.current = new Date().toISOString();
        
        // Determine if we should go to longBreak or regular break
        // If we've completed all sessions in the cycle, go to long break
        // Otherwise, go to regular break
        const nextMode: TimerMode = 
          completedSessions + 1 >= settings.sessionsUntilLongBreak 
            ? 'longBreak' 
            : 'break';
            
        setTimerMode(nextMode);
        
        // Reset timer state to initialize the new mode's time values
        resetTimerState();
        
        // Give a slight delay before auto-starting to ensure UI updates
        setTimeout(() => {
          console.log(`Auto-starting next timer mode: ${nextMode}`);
          setIsRunning(true);
          isTransitioningRef.current = false;
        }, 1000);
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
        
        // After break, go back to work mode but keep the currentSessionIndex
        console.log(`Break session completed. Session index remains at ${currentSessionIndex}`);
        setTimerMode('work');
        
        // Reset timer state to initialize the new mode's time values
        resetTimerState();
        
        // Give a slight delay before auto-starting to ensure UI updates
        setTimeout(() => {
          console.log(`Auto-starting next work session after break`);
          setIsRunning(true);
          isTransitioningRef.current = false;
        }, 1000);
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
        isTransitioningRef.current = false;
      }
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
