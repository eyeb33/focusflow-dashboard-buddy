
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
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    // Try to restore timer mode from storage
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return parsed.timerMode || 'work';
    }
    return 'work';
  });
  
  const [isRunning, setIsRunning] = useState(() => {
    // Don't auto-start on initial load, but remember if it was running
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Store was running state but don't auto-resume
      return false;
    }
    return false;
  });
  
  const [timeRemaining, setTimeRemaining] = useState(() => {
    // Try to restore time from storage
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.timeRemaining !== undefined) {
        console.log("Restored timer with time:", parsed.timeRemaining);
        return parsed.timeRemaining;
      }
    }
    return settings.workDuration * 60;
  });
  
  // Stats tracking
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(() => {
    // Try to restore session index from storage
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.currentSessionIndex !== undefined) {
        return parsed.currentSessionIndex;
      }
    }
    return 0;
  });
  
  // Timer refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTimeRef = useRef<string | null>(null);
  const settingsRef = useRef(settings);
  const wasRunningRef = useRef(false);
  const lastTickTimeRef = useRef<number>(Date.now());
  
  // Save the current timer state to localStorage
  const saveTimerState = useCallback(() => {
    const timerState = {
      timerMode,
      isRunning,
      timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
    console.log("Saved timer state:", timerState);
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex]);
  
  // Restore session start time
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.sessionStartTime) {
        sessionStartTimeRef.current = parsed.sessionStartTime;
      }
    }
  }, []);
  
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
  
  // Save state on changes
  useEffect(() => {
    saveTimerState();
  }, [timerMode, isRunning, timeRemaining, currentSessionIndex, saveTimerState]);
  
  // Handle visibility change to adjust timer when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, store the running state
        wasRunningRef.current = isRunning;
        console.log("Tab hidden, timer was running:", wasRunningRef.current);
        // Record the time when hidden
        lastTickTimeRef.current = Date.now();
      } else {
        // Tab is visible again
        console.log("Tab visible again, timer was running:", wasRunningRef.current);
        
        // Check if timer was running before hiding
        if (wasRunningRef.current && !isRunning) {
          // Resume the timer
          setIsRunning(true);
        }
        
        // If timer is running, adjust the time based on how long it was hidden
        if (isRunning || wasRunningRef.current) {
          const now = Date.now();
          const elapsedMs = now - lastTickTimeRef.current;
          const elapsedSeconds = Math.floor(elapsedMs / 1000);
          
          console.log(`Tab was hidden for ${elapsedSeconds} seconds`);
          
          if (elapsedSeconds >= 1) {
            setTimeRemaining(prevTime => {
              const newTime = Math.max(0, prevTime - elapsedSeconds);
              console.log(`Adjusting time from ${prevTime} to ${newTime}`);
              
              if (newTime <= 0) {
                setTimeout(() => handleTimerComplete(), 0);
                return 0;
              }
              return newTime;
            });
          }
          
          lastTickTimeRef.current = now;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);
  
  // Handle page navigation using the beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save timer state before navigating away
      saveTimerState();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveTimerState]);
  
  // Handle timer tick
  useEffect(() => {
    // Always clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      console.log("Starting timer with mode:", timerMode, "and time:", timeRemaining);
      
      // Ensure we have a session start time
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
      }
      
      lastTickTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.max(1, Math.floor(elapsedMs / 1000));
        
        setTimeRemaining(prevTime => {
          if (prevTime <= elapsedSeconds) {
            // Clear the timer and handle completion
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // We use setTimeout to ensure state updates occur in the next event loop
            setTimeout(() => handleTimerComplete(), 0);
            return 0;
          }
          const newTime = prevTime - elapsedSeconds;
          
          // Save timer state every 5 seconds
          if (prevTime % 5 === 0 || newTime % 5 === 0) {
            saveTimerState();
          }
          
          return newTime;
        });
        
        lastTickTimeRef.current = now;
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timerMode, saveTimerState]);
  
  // Timer control functions
  const handleStart = useCallback(() => {
    console.log("Starting timer...");
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    setIsRunning(true);
    lastTickTimeRef.current = Date.now();
  }, []);
  
  const handlePause = useCallback(() => {
    console.log("Pausing timer...");
    setIsRunning(false);
    
    // Save state immediately on pause
    const timerState = {
      timerMode,
      isRunning: false,
      timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current,
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, [timerMode, timeRemaining, currentSessionIndex]);
  
  const handleReset = useCallback(() => {
    // Stop the timer
    setIsRunning(false);
    
    // Reset the time
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    
    console.log("Timer reset to", newTime, "seconds");
    
    // Save the reset state
    const timerState = {
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null,
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, [getTotalTimeForMode, timerMode, currentSessionIndex]);
  
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
    
    // Save the new mode state
    const timerState = {
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : currentSessionIndex,
      sessionStartTime: null,
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, [getTotalTimeForMode, currentSessionIndex]);
  
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
      
      // Save the new state after completion
      const timerState = {
        timerMode: nextMode,
        isRunning: true,
        timeRemaining: nextMode === 'longBreak' ? currentSettings.longBreakDuration * 60 : currentSettings.breakDuration * 60,
        currentSessionIndex: newIndex,
        sessionStartTime: sessionStartTimeRef.current,
        timestamp: Date.now()
      };
      localStorage.setItem('timerState', JSON.stringify(timerState));
    } else {
      // After any break, return to work mode
      setTimerMode('work');
      setTimeRemaining(currentSettings.workDuration * 60);
      
      // Auto-start next session
      sessionStartTimeRef.current = new Date().toISOString();
      
      // For long break, don't auto-start
      if (currentMode === 'longBreak') {
        setIsRunning(false);
        setCurrentSessionIndex(0);
      } else {
        setTimeout(() => setIsRunning(true), 500);
      }
      
      // Save the new state after completion
      const timerState = {
        timerMode: 'work',
        isRunning: currentMode !== 'longBreak', // Don't auto-start after long break
        timeRemaining: currentSettings.workDuration * 60,
        currentSessionIndex: currentMode === 'longBreak' ? 0 : currentSessionIndex,
        sessionStartTime: sessionStartTimeRef.current,
        timestamp: Date.now()
      };
      localStorage.setItem('timerState', JSON.stringify(timerState));
      
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
