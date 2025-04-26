
import { useState, useEffect, useRef } from 'react';
import { TimerMode, getTotalTime } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { useAuth } from '@/contexts/AuthContext';

export function useTimer(settings: TimerSettings) {
  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => getTotalTime('work', settings));
  const [autoStart, setAutoStart] = useState(false);
  
  // Stats tracking
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<string | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const lastRecordedFullMinutesRef = useRef<number>(0);
  
  const { user } = useAuth();
  
  // Calculate total time for current timer mode
  const getTotalTimeForMode = (): number => {
    return getTotalTime(timerMode, settings);
  };
  
  // Calculate progress (0 to 1)
  const totalTime = getTotalTimeForMode();
  const elapsedTime = totalTime - timeRemaining;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, elapsedTime / totalTime)) : 0;
  
  // Load timer state from localStorage on mount
  useEffect(() => {
    try {
      const storedStateStr = localStorage.getItem('timerState');
      if (storedStateStr) {
        const storedState = JSON.parse(storedStateStr);
        setTimerMode(storedState.timerMode || 'work');
        setTimeRemaining(storedState.timeRemaining || getTotalTime('work', settings));
        
        // IMPORTANT: Start with timer paused - user must manually start
        setIsRunning(false);
        
        if (storedState.sessionStartTime) {
          sessionStartTimeRef.current = storedState.sessionStartTime;
        }
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
      localStorage.removeItem('timerState');
    }
  }, []);
  
  // Clear any existing timer when unmounting
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Handle timer tick
  useEffect(() => {
    // Always clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      lastTickTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const actualElapsed = now - lastTickTimeRef.current;
        
        setTimeRemaining(prevTime => {
          // Calculate adjustment if timer drift occurs
          const adjustment = Math.max(0, Math.floor((actualElapsed - 1000) / 1000));
          
          // If time is about to expire, handle completion
          if (prevTime <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            handleTimerComplete();
            return 0;
          }
          
          const secondsToSubtract = 1 + adjustment;
          const newTime = Math.max(0, prevTime - secondsToSubtract);
          
          // Save state in localStorage
          const timerState = {
            isRunning: true,
            timerMode,
            timeRemaining: newTime,
            totalTime: getTotalTimeForMode(),
            timestamp: now,
            sessionStartTime: sessionStartTimeRef.current
          };
          localStorage.setItem('timerState', JSON.stringify(timerState));
          
          // Save partial session at minute boundaries for work sessions
          const totalTime = getTotalTimeForMode();
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = lastRecordedFullMinutesRef.current;
          
          if (user && timerMode === 'work' && newFullMinutes > prevFullMinutes) {
            lastRecordedFullMinutesRef.current = newFullMinutes;
            // NOTE: We're intentionally not awaiting this
            savePartialSession(
              user.id, 
              timerMode, 
              totalTime,
              newTime,
              prevFullMinutes
            );
          }
          
          lastTickTimeRef.current = now;
          return newTime;
        });
      }, 1000);
    } else {
      // When paused, preserve the current time in localStorage
      const timerState = {
        isRunning: false,
        timerMode,
        timeRemaining,
        totalTime: getTotalTimeForMode(),
        timestamp: Date.now(),
        sessionStartTime: sessionStartTimeRef.current
      };
      localStorage.setItem('timerState', JSON.stringify(timerState));
    }
  }, [isRunning, timerMode, user]);
  
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
      localStorage.setItem('sessionStartTime', sessionStartTimeRef.current);
    }
    
    setIsRunning(true);
    console.log("Timer started with time remaining:", timeRemaining);
  };
  
  const handlePause = () => {
    setIsRunning(false);
    console.log("Timer paused with time remaining:", timeRemaining);
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
    localStorage.removeItem('sessionStartTime');
    
    console.log("Timer reset to:", newTime);
  };
  
  const handleModeChange = (mode: TimerMode) => {
    // Stop the timer when changing modes
    setIsRunning(false);
    
    // Reset tracking
    lastRecordedFullMinutesRef.current = 0;
    sessionStartTimeRef.current = null;
    localStorage.removeItem('sessionStartTime');
    
    // Change the mode and set appropriate time
    setTimerMode(mode);
    const newTime = getTotalTime(mode, settings);
    setTimeRemaining(newTime);
    
    // Reset the current session index when manually changing modes
    if (mode === 'work') {
      setCurrentSessionIndex(0);
    }
    
    console.log(`Timer mode changed to ${mode} with time:`, newTime);
  };
  
  // Timer completion handler
  const handleTimerComplete = () => {
    const currentMode = timerMode;
    let nextMode: TimerMode;
    let resetCurrentIndex = false;
    
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
    localStorage.removeItem('sessionStartTime');
    
    // Reset tracking
    lastRecordedFullMinutesRef.current = 0;
    
    // Change to next mode and set appropriate time
    setTimerMode(nextMode);
    const newTime = getTotalTime(nextMode, settings);
    setTimeRemaining(newTime);
    
    // Reset session index if needed
    if (resetCurrentIndex) {
      setCurrentSessionIndex(0);
    }
    
    // Auto-start next session if enabled
    if (autoStart) {
      setTimeout(() => {
        sessionStartTimeRef.current = new Date().toISOString();
        localStorage.setItem('sessionStartTime', sessionStartTimeRef.current);
        setIsRunning(true);
      }, 1000);
    }
    
    console.log(`Timer completed. Mode changed from ${currentMode} to ${nextMode}`);
  };
  
  // Helper function to save partial session data
  const savePartialSession = async (
    userId: string,
    mode: TimerMode,
    totalTime: number,
    timeRemaining: number,
    previousFullMinutes: number,
    date?: string
  ) => {
    try {
      const elapsedSeconds = totalTime - timeRemaining;
      const newFullMinutes = Math.floor(elapsedSeconds / 60);
      const minutesToLog = newFullMinutes - previousFullMinutes;
      
      if (minutesToLog <= 0) return;
      
      console.log(`Logging ${minutesToLog} minutes of ${mode} time`);
      
      // In a real implementation, this would save to a database
      return { newFullMinutes };
    } catch (error) {
      console.error('Error saving partial session:', error);
    }
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
    autoStart,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    progress,
    
    // Timer actions
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    setAutoStart,
    
    // Helper functions
    formatTime,
    getModeLabel,
    
    // For advanced usage
    sessionStartTimeRef,
  };
}

// Re-export the same interface as before for compatibility
export const useTimerControls = () => {
  const timerContext = useTimerContext();
  return timerContext;
};

export const useTimerStats = () => {
  const timerContext = useTimerContext();
  return timerContext;
};

// Import this to maintain compatibility with existing code
import { useTimerContext } from '@/contexts/TimerContext';
