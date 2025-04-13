
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveFocusSession } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';
import { getTotalTime, savePartialSession, TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { useTimerInterval } from './useTimerInterval';

export function useTimerLogic(settings: TimerSettings) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [autoStart, setAutoStart] = useState(false);
  
  const lastRecordedTimeRef = useRef<number | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);
  
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
              setIsRunning(state.isRunning);
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

  // Reset timer when mode or settings change
  useEffect(() => {
    // Only reset if not running
    if (!isRunning && !autoStart) {
      setTimeRemaining(getTotalTime(timerMode, settings));
      lastRecordedTimeRef.current = getTotalTime(timerMode, settings);
      lastRecordedFullMinutesRef.current = 0;
    }
    
    // Clear the autoStart flag after applying it
    if (autoStart) {
      setAutoStart(false);
    }
  }, [timerMode, settings, isRunning, autoStart]);

  // Handle timer completion
  const handleTimerComplete = async () => {
    console.log(`Timer completed for mode: ${timerMode}`);
    setIsRunning(false);
    
    if (timerMode === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Update total focus time in minutes
      const workDurationMinutes = settings.workDuration;
      setTotalTimeToday(prev => prev + workDurationMinutes);
      
      // Save completed session to Supabase
      if (user) {
        console.log('Saving completed work session');
        await saveFocusSession(user.id, timerMode, settings.workDuration * 60, true);
        await updateDailyStats(user.id, settings.workDuration);
      }
      
      // Determine next break type and automatically transition
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setTimerMode('longBreak');
        setTimeRemaining(settings.longBreakDuration * 60);
      } else {
        setTimerMode('break');
        setTimeRemaining(settings.breakDuration * 60);
      }
      
      // Auto-start the break timer
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
      
      // Show toast for completed work session
      toast({
        title: "Session completed!",
        description: `You completed a ${settings.workDuration} minute focus session.`,
      });
    } else {
      // For break sessions
      if (user) {
        const duration = timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
        console.log(`Saving completed ${timerMode} session`);
        await saveFocusSession(user.id, timerMode, duration, true);
        // We don't count break time in productivity stats, but still track them
      }
      
      // Automatically transition to work mode
      setTimerMode('work');
      setTimeRemaining(settings.workDuration * 60);
      
      // Auto-start the next work session
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
      
      // Show toast for completed break
      toast({
        title: timerMode === 'break' ? "Break completed!" : "Long break completed!",
        description: "Starting your next focus session.",
      });
    }
    
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
  };

  // Get the current total time based on timer mode
  const getCurrentTotalTime = () => getTotalTime(timerMode, settings);

  // Use the timer interval hook
  useTimerInterval({
    isRunning,
    timerMode,
    timeRemaining,
    setTimeRemaining,
    getTotalTime: getCurrentTotalTime,
    onTimerComplete: handleTimerComplete,
    lastRecordedFullMinutesRef
  });

  // Timer control functions
  const handleStart = () => {
    console.log('Starting timer');
    lastRecordedTimeRef.current = timeRemaining;
    const totalTime = getTotalTime(timerMode, settings);
    const elapsedSeconds = totalTime - timeRemaining;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    setIsRunning(true);
  };
  
  const handlePause = async () => {
    console.log('Pausing timer');
    setIsRunning(false);
    if (user && lastRecordedTimeRef.current && timerMode === 'work') {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
  };
  
  const handleReset = async () => {
    console.log('Resetting timer');
    setIsRunning(false);
    if (user && lastRecordedTimeRef.current && timerMode === 'work') {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    setTimeRemaining(getTotalTime(timerMode, settings));
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
  };

  const handleModeChange = async (mode: TimerMode) => {
    console.log(`Changing mode to: ${mode}`);
    if (isRunning && user && lastRecordedTimeRef.current && timerMode === 'work') {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    
    setIsRunning(false);
    setTimerMode(mode);
    setTimeRemaining(getTotalTime(mode, settings));
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
  };

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    setCompletedSessions,
    setTotalTimeToday,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
