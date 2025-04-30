
import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { saveFocusSession } from '@/utils/timerStorage';

export function useTimer(settings: TimerSettings) {
  // Get user context for tracking stats
  const { user } = useAuth();

  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => settings.workDuration * 60);
  
  // Stats tracking
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  
  // Update settings ref when settings change
  useEffect(() => {
    settingsRef.current = settings;
    
    // Update timer duration if not running
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      setTimeRemaining(newTime);
    }
  }, [settings, isRunning]);
  
  // Calculate total time for current timer mode
  const getTotalTimeForMode = useCallback((): number => {
    const currentSettings = settingsRef.current;
    switch (timerMode) {
      case 'work':
        return currentSettings.workDuration * 60;
      case 'break':
        return currentSettings.breakDuration * 60;
      case 'longBreak':
        return currentSettings.longBreakDuration * 60;
      default:
        return currentSettings.workDuration * 60;
    }
  }, [timerMode]);
  
  // Calculate progress (0 to 100)
  const totalTime = getTotalTimeForMode();
  const elapsedTime = totalTime - timeRemaining;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, elapsedTime / totalTime)) * 100 : 0;
  
  // Handle timer tick
  useEffect(() => {
    // Always clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      console.log("Starting timer with mode:", timerMode, "and time:", timeRemaining);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            // Clear the timer and handle completion
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // We use setTimeout to ensure state updates occur in the next event loop
            setTimeout(() => handleTimerComplete(), 0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timerMode]);
  
  // Timer control functions
  const handleStart = useCallback(() => {
    console.log("Starting timer...");
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    setIsRunning(true);
  }, []);
  
  const handlePause = useCallback(() => {
    console.log("Pausing timer...");
    setIsRunning(false);
  }, []);
  
  const handleReset = useCallback(() => {
    // Stop the timer
    setIsRunning(false);
    
    // Reset the time
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    
    console.log("Timer reset to", newTime, "seconds");
  }, [getTotalTimeForMode]);
  
  const handleModeChange = useCallback((mode: TimerMode) => {
    // Stop the timer when changing modes
    setIsRunning(false);
    
    // Reset session tracking
    sessionStartTimeRef.current = null;
    
    // Change the mode
    setTimerMode(mode);
    
    // Set the appropriate time for the new mode
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Reset the current session index when manually changing modes
    if (mode === 'work') {
      setCurrentSessionIndex(0);
    }
  }, [getTotalTimeForMode]);
  
  // Timer completion handler
  const handleTimerComplete = useCallback(() => {
    const currentMode = timerMode;
    const currentSettings = settingsRef.current;
    
    console.log("Timer completed with mode:", currentMode);
    toast.success(`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} session completed!`);
    
    // Stop the timer
    setIsRunning(false);
    
    // Save session data if user is logged in
    if (user && sessionStartTimeRef.current) {
      const sessionDuration = currentMode === 'work' 
        ? currentSettings.workDuration * 60
        : currentMode === 'break'
          ? currentSettings.breakDuration * 60
          : currentSettings.longBreakDuration * 60;
          
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
      const workSeconds = currentSettings.workDuration * 60;
      setTotalTimeToday(prev => prev + workSeconds);
      
      // Update session index
      const newIndex = (currentSessionIndex + 1) % currentSettings.sessionsUntilLongBreak;
      setCurrentSessionIndex(newIndex);
      
      console.log(`Work session completed. Moving from session ${currentSessionIndex} to ${newIndex}`);
      
      // Determine if it's time for a long break
      const nextMode = newIndex === 0 ? 'longBreak' : 'break';
      setTimerMode(nextMode);
      setTimeRemaining(nextMode === 'longBreak' ? currentSettings.longBreakDuration * 60 : currentSettings.breakDuration * 60);
      
      // Auto-start next session
      sessionStartTimeRef.current = new Date().toISOString();
      setTimeout(() => setIsRunning(true), 500);
    } else {
      // After any break, return to work mode
      setTimerMode('work');
      setTimeRemaining(currentSettings.workDuration * 60);
      
      // Auto-start next session
      sessionStartTimeRef.current = new Date().toISOString();
      setTimeout(() => setIsRunning(true), 500);
      
      // If it was a long break, reset the session counter
      if (currentMode === 'longBreak') {
        setCurrentSessionIndex(0);
      }
    }
  }, [timerMode, currentSessionIndex, user]);
  
  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get mode label helper
  const getModeLabel = (): string => {
    switch (timerMode) {
      case 'work': return 'Focus';
      case 'break': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Timer';
    }
  };
  
  return {
    // Timer state
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    progress,
    
    // Timer actions
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    
    // Helper functions
    formatTime,
    getModeLabel,
    
    // For advanced usage
    sessionStartTimeRef,
  };
}
