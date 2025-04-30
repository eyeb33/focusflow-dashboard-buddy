
import { useState, useEffect, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';

export function useTimer(settings: TimerSettings) {
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
  const lastTickTimeRef = useRef<number>(Date.now());
  const lastRecordedFullMinutesRef = useRef<number>(0);
  
  // Calculate total time for current timer mode
  const getTotalTimeForMode = (): number => {
    switch (timerMode) {
      case 'work':
        return settings.workDuration * 60;
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  };
  
  // Calculate progress (0 to 1)
  const totalTime = getTotalTimeForMode();
  const elapsedTime = totalTime - timeRemaining;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, elapsedTime / totalTime)) : 0;
  
  // Handle timer tick
  useEffect(() => {
    // Always clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      lastTickTimeRef.current = Date.now();
      console.log("Starting timer tick with mode:", timerMode, "and time:", timeRemaining);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleTimerComplete();
            return 0;
          }
          
          return Math.max(0, prevTime - 1);
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
  
  // Update settings when they change (only if timer is not running)
  useEffect(() => {
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      setTimeRemaining(newTime);
    }
  }, [settings, timerMode, isRunning]);
  
  // Timer control functions
  const handleStart = () => {
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    console.log("handleStart called - Setting isRunning to true");
    setIsRunning(true);
  };
  
  const handlePause = () => {
    console.log("handlePause called - Setting isRunning to false");
    setIsRunning(false);
  };
  
  const handleReset = () => {
    // Stop the timer
    setIsRunning(false);
    
    // Reset the time
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    lastRecordedFullMinutesRef.current = 0;
    
    // Reset session start time
    sessionStartTimeRef.current = null;
  };
  
  const handleModeChange = (mode: TimerMode) => {
    // Stop the timer when changing modes
    setIsRunning(false);
    
    // Reset tracking
    lastRecordedFullMinutesRef.current = 0;
    sessionStartTimeRef.current = null;
    
    // Change the mode and set appropriate time
    setTimerMode(mode);
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Reset the current session index when manually changing modes
    if (mode === 'work') {
      setCurrentSessionIndex(prevIndex => prevIndex % settings.sessionsUntilLongBreak);
    }
  };
  
  // Timer completion handler
  const handleTimerComplete = () => {
    const currentMode = timerMode;
    let nextMode: TimerMode;
    let resetCurrentIndex = false;
    
    console.log("Timer completed with mode:", currentMode);
    
    // Determine next mode
    if (currentMode === 'work') {
      // Increment completed sessions counter
      setCompletedSessions(prev => prev + 1);
      
      // Add work time to total time for today
      const workSeconds = settings.workDuration * 60;
      setTotalTimeToday(prev => prev + workSeconds);
      
      // Update session index
      const newIndex = (currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
      setCurrentSessionIndex(newIndex);
      
      // Determine if it's time for a long break
      nextMode = (newIndex === 0) ? 'longBreak' : 'break';
    } else {
      // After any break, return to work mode
      nextMode = 'work';
      if (currentMode === 'longBreak') {
        resetCurrentIndex = true;
      }
    }
    
    // Stop the timer
    setIsRunning(false);
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    
    // Reset tracking
    lastRecordedFullMinutesRef.current = 0;
    
    // Change to next mode and set appropriate time
    setTimerMode(nextMode);
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Reset session index if needed
    if (resetCurrentIndex) {
      setCurrentSessionIndex(0);
    }
    
    // Auto-start next session
    setTimeout(() => {
      sessionStartTimeRef.current = new Date().toISOString();
      setIsRunning(true);
    }, 1000);
  };
  
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
