
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
  
  useEffect(() => {
    sessionStartTimeRef.current = new Date().toISOString();
  }, [timerMode]);
  
  const handleTimerComplete = async () => {
    try {
      await playTimerCompletionSound(timerMode);
      
      const totalTime = getTotalTime(timerMode, settings);
      const sessionStartTime = sessionStartTimeRef.current || new Date().toISOString();
      
      if (timerMode === 'work') {
        const minutes = settings.workDuration;
        console.log(`Timer completed with ${minutes} minutes for work session`);
        if (user) {
          await saveFocusSession(
            user.id, 
            timerMode, 
            totalTime, 
            true,
            sessionStartTime
          );
          setCompletedSessions(prev => prev + 1);
          setTotalTimeToday(prev => prev + minutes);
          const sessionStartDate = new Date(sessionStartTime).toISOString().split('T')[0];
          await updateDailyStats(user.id, minutes, timerMode, sessionStartDate);
        }
        
        const newSessionIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
        setCurrentSessionIndex(newSessionIndex);
        console.log(`Work session completed. Moving from session ${currentSessionIndex} to ${newSessionIndex}`);
        console.log(`After completion: completed sessions=${completedSessions + 1}, currentSessionIndex=${newSessionIndex}`);
        sessionStartTimeRef.current = new Date().toISOString();
        const nextMode: TimerMode = newSessionIndex === 0 ? 'longBreak' : 'break';
        setTimerMode(nextMode);
      } 
      else if (timerMode === 'break') {
        if (user) {
          await saveFocusSession(
            user.id, 
            timerMode, 
            totalTime, 
            true,
            sessionStartTime
          );
        }
        sessionStartTimeRef.current = new Date().toISOString();
        console.log(`Break session completed. Keeping session index at ${currentSessionIndex}`);
        setTimerMode('work');
      } 
      else {
        // This handles the longBreak case correctly without type comparison issues
        if (user) {
          await saveFocusSession(
            user.id, 
            timerMode, 
            totalTime, 
            true,
            sessionStartTime
          );
        }
        sessionStartTimeRef.current = new Date().toISOString();
        console.log('Long break completed - starting a new cycle');
        setCurrentSessionIndex(0);
        setTimerMode('work');
        resetTimerState();
        setIsRunning(false);
        return;
      }
      
      resetTimerState();
      
      // Handle auto-start based on timer mode using string comparison
      if (timerMode === 'work' || timerMode === 'break') {
        // Auto-start for work and short break sessions
        setTimeout(() => {
          setIsRunning(true);
        }, 1000);
      } else {
        // Don't auto-start after long break
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Error handling timer completion:', error);
      setTimerMode('work');
      setIsRunning(false);
      resetTimerState();
    }
  };

  return { handleTimerComplete, sessionStartTimeRef };
}
