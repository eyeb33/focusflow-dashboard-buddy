
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';
import { useToast } from '@/hooks/use-toast';
import { saveFocusSession } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';

interface TimerPersistenceParams {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  settings: TimerSettings;
  completedSessions: number;
  setTimerMode: (mode: TimerMode) => void;
  setTimeRemaining: (time: React.SetStateAction<number>) => void;
  setIsRunning: (value: React.SetStateAction<boolean>) => void;
  setCompletedSessions: (value: React.SetStateAction<number>) => void;
  setTotalTimeToday: (value: React.SetStateAction<number>) => void;
  setAutoStart: (value: React.SetStateAction<boolean>) => void;
}

export function useTimerPersistence({
  timerMode,
  isRunning,
  timeRemaining,
  settings,
  completedSessions,
  setTimerMode,
  setTimeRemaining,
  setIsRunning,
  setCompletedSessions,
  setTotalTimeToday,
  setAutoStart
}: TimerPersistenceParams) {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastRecordedTimeRef = useRef<number | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);
  
  // Get total time based on timer mode
  const getTotalTime = (mode: TimerMode, settings: TimerSettings): number => {
    switch (mode) {
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      case 'work':
      default:
        return settings.workDuration * 60;
    }
  };
  
  // Load saved timer state on mount
  useEffect(() => {
    const savedTimerState = localStorage.getItem('timerState');
    
    if (savedTimerState) {
      try {
        const state = JSON.parse(savedTimerState);
        
        // Verify the state object has the expected structure
        if (state && state.timerMode && state.timeRemaining !== undefined) {
          // Calculate how much time has passed since the timer state was saved
          const now = Date.now();
          const lastTickTime = state.lastTickTime || now;
          const elapsedSeconds = Math.floor((now - lastTickTime) / 1000);
          
          // Only restore if we have valid time data
          if (!isNaN(elapsedSeconds) && elapsedSeconds >= 0) {
            // Calculate new time remaining
            const newTimeRemaining = Math.max(0, state.timeRemaining - elapsedSeconds);
            console.log('Restored timer state:', { 
              elapsedSeconds,
              originalTime: state.timeRemaining,
              newTimeRemaining
            });
            
            // If timer has completed while away, handle completion
            if (newTimeRemaining <= 0) {
              // We'll handle this completed session
              if (state.timerMode === 'work') {
                setCompletedSessions(prev => prev + 1);
                const workDurationMinutes = settings.workDuration;
                setTotalTimeToday(prev => prev + workDurationMinutes);
                
                if (user) {
                  console.log('Completing work session that finished while away');
                  saveFocusSession(user.id, state.timerMode, settings.workDuration * 60, true)
                    .then(() => {
                      updateDailyStats(user.id, settings.workDuration);
                    });
                }
                
                // Go to break mode
                const newCompletedSessions = completedSessions + 1;
                if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
                  setTimerMode('longBreak');
                  setTimeRemaining(settings.longBreakDuration * 60);
                } else {
                  setTimerMode('break');
                  setTimeRemaining(settings.breakDuration * 60);
                }
                
                // Show a toast notification
                toast({
                  title: "Session completed while you were away!",
                  description: `You completed a ${settings.workDuration} minute focus session.`,
                });
                
                // Auto-start the break timer
                setIsRunning(true);
                setAutoStart(true);
              } else {
                // Break timer completed
                if (user) {
                  const duration = state.timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
                  saveFocusSession(user.id, state.timerMode, duration, true);
                }
                
                // Go back to work mode
                setTimerMode('work');
                setTimeRemaining(settings.workDuration * 60);
                
                // Auto-start the next work session
                setIsRunning(true);
                setAutoStart(true);
                
                toast({
                  title: `${state.timerMode === 'break' ? 'Break' : 'Long Break'} completed!`,
                  description: "Starting your next focus session.",
                });
              }
            } else {
              // Timer still has time remaining, restore state
              setTimerMode(state.timerMode);
              setTimeRemaining(newTimeRemaining);
              // Restore as paused - let the user manually start again
              setIsRunning(false);
              lastRecordedFullMinutesRef.current = state.lastRecordedFullMinutes || 0;
            }
          }
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        // Fallback to defaults if restore fails
        setTimeRemaining(getTotalTime(timerMode, settings));
      }
      
      // Clear the saved state to prevent reloading it on refresh
      localStorage.removeItem('timerState');
    } else {
      // No saved state, initialize with default values
      setTimeRemaining(getTotalTime(timerMode, settings));
    }
  }, []);  // Empty dependency array means this runs once on mount

  return {
    lastRecordedTimeRef,
    lastRecordedFullMinutesRef,
    getTotalTime
  };
}
