
import { useState, useRef, useEffect, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { formatTime as formatTimeUtil, getModeLabel as getModeLabelUtil } from '@/utils/timerUtils';

// Default settings to use if none are provided
const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

/**
 * Main timer hook that provides all timer functionality
 */
export const useTimer = (settings: TimerSettings = DEFAULT_SETTINGS) => {
  // Use provided settings or defaults if undefined
  const timerSettings = settings || DEFAULT_SETTINGS;
  
  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(() => timerSettings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  // References for timer management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<string | null>(null);
  const pausedTimeRef = useRef<number | null>(null);
  
  // Calculate progress
  const getTotalTimeForMode = useCallback(() => {
    switch (timerMode) {
      case 'work': return timerSettings.workDuration * 60;
      case 'break': return timerSettings.breakDuration * 60;
      case 'longBreak': return timerSettings.longBreakDuration * 60;
      default: return timerSettings.workDuration * 60;
    }
  }, [timerMode, timerSettings]);
  
  const progress = Math.max(0, Math.min(100, 
    ((getTotalTimeForMode() - timeRemaining) / getTotalTimeForMode()) * 100
  ));
  
  // Format time and get mode label
  const formatTime = useCallback((seconds: number) => {
    return formatTimeUtil(seconds);
  }, []);
  
  const getModeLabel = useCallback((mode?: TimerMode) => {
    return getModeLabelUtil(mode || timerMode);
  }, [timerMode]);
  
  // Save timer state to localStorage
  const saveTimerState = useCallback((state: any) => {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now()
    };
    console.log(`Saving timer state:`, stateWithTimestamp);
    localStorage.setItem('timerState', JSON.stringify(stateWithTimestamp));
  }, []);
  
  // Load initial timer state
  useEffect(() => {
    try {
      const savedStateJson = localStorage.getItem('timerState');
      if (savedStateJson) {
        const savedState = JSON.parse(savedStateJson);
        const now = Date.now();
        const elapsed = now - (savedState.timestamp || 0);
        
        // Only restore if recent (< 30 minutes) and valid
        if (elapsed < 1800000 && typeof savedState.timeRemaining === 'number') {
          console.log('Restoring timer state:', savedState);
          
          // Restore timer state but don't auto-start
          setTimerMode(savedState.timerMode || 'work');
          setTimeRemaining(savedState.timeRemaining);
          setCurrentSessionIndex(savedState.currentSessionIndex || 0);
          
          if (savedState.sessionStartTime) {
            sessionStartTimeRef.current = savedState.sessionStartTime;
          }
        }
      }
    } catch (error) {
      console.error('Error loading saved timer state:', error);
    }
  }, []);
  
  // Update timer when settings change (when not running)
  useEffect(() => {
    if (!isRunning) {
      const newTime = getTotalTimeForMode();
      console.log(`Settings changed: Updating timer to ${newTime} seconds`);
      setTimeRemaining(newTime);
      
      // Save the updated state
      saveTimerState({
        timerMode,
        isRunning: false,
        timeRemaining: newTime,
        currentSessionIndex,
        sessionStartTime: null
      });
    }
  }, [timerSettings, timerMode, isRunning, currentSessionIndex, getTotalTimeForMode, saveTimerState]);
  
  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    console.log('Timer complete for mode:', timerMode);
    
    // Always stop the timer first
    setIsRunning(false);
    
    // Clear session start time
    sessionStartTimeRef.current = null;
    
    if (timerMode === 'work') {
      // After work session
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Add to today's total time
      setTotalTimeToday(prev => prev + timerSettings.workDuration);
      
      // Move to next session in cycle
      const newSessionIndex = (currentSessionIndex + 1) % timerSettings.sessionsUntilLongBreak;
      setCurrentSessionIndex(newSessionIndex);
      
      // Determine if we should take a long break
      const nextMode = newSessionIndex === 0 ? 'longBreak' : 'break';
      setTimerMode(nextMode);
      
      // Set time for the new mode
      const newTime = nextMode === 'break' ? 
        timerSettings.breakDuration * 60 : timerSettings.longBreakDuration * 60;
      setTimeRemaining(newTime);
      
      // Auto-start the break
      setTimeout(() => {
        setIsRunning(true);
      }, 500);
    } else {
      // After any break, go back to work mode
      setTimerMode('work');
      setTimeRemaining(timerSettings.workDuration * 60);
      
      // Auto-start only after short breaks
      if (timerMode === 'break') {
        setTimeout(() => {
          setIsRunning(true);
        }, 500);
      }
    }
  }, [timerMode, timerSettings, completedSessions, currentSessionIndex, setCompletedSessions, setTimerMode]);
  
  // Timer tick effect - THE CORE TIMER LOGIC
  useEffect(() => {
    // Clear any existing interval first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isRunning) {
      console.log(`Starting timer with mode: ${timerMode}, time: ${timeRemaining}`);
      
      // Record session start time if not set
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = new Date().toISOString();
      }
      
      lastTickTimeRef.current = Date.now();
      
      // Start the timer interval
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedMs = now - lastTickTimeRef.current;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Only update if at least 1 second has passed
        if (elapsedSeconds >= 1) {
          setTimeRemaining(prevTime => {
            // Check if timer completed
            if (prevTime <= elapsedSeconds) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // Handle timer completion in next event loop
              setTimeout(() => handleTimerComplete(), 0);
              return 0;
            }
            
            // Calculate new time remaining
            const newTime = prevTime - elapsedSeconds;
            
            // Save timer state periodically (every 5 seconds)
            if (prevTime % 5 === 0 || newTime % 5 === 0) {
              saveTimerState({
                timerMode,
                isRunning: true,
                timeRemaining: newTime,
                currentSessionIndex,
                sessionStartTime: sessionStartTimeRef.current
              });
            }
            
            lastTickTimeRef.current = now;
            return newTime;
          });
        }
      }, 200); // Check more frequently for smoother updates
    }
    
    // Cleanup interval on unmount or dependency changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, timerMode, handleTimerComplete, currentSessionIndex, saveTimerState, timeRemaining]);
  
  // Handle visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // When page becomes hidden
        if (isRunning) {
          // Store the current time
          pausedTimeRef.current = timeRemaining;
          console.log('Page hidden while timer running - storing time:', timeRemaining);
        }
      } else if (document.visibilityState === 'visible') {
        // When page becomes visible again
        if (isRunning) {
          const now = Date.now();
          const lastTick = lastTickTimeRef.current;
          const elapsedSeconds = Math.floor((now - lastTick) / 1000);
          
          if (elapsedSeconds >= 1) {
            console.log(`Page visible after ${elapsedSeconds}s - adjusting timer`);
            
            // Use stored pause time if available
            const timeToUse = pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining;
            pausedTimeRef.current = null;
            
            // Calculate new time
            const newTime = Math.max(0, timeToUse - elapsedSeconds);
            
            // If timer completed while away
            if (newTime <= 0) {
              setTimeRemaining(0);
              setIsRunning(false);
              setTimeout(() => handleTimerComplete(), 0);
            } else {
              setTimeRemaining(newTime);
            }
            
            // Update last tick time
            lastTickTimeRef.current = now;
          }
        }
      }
    };
    
    // Register visibility change handler
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, timeRemaining, handleTimerComplete]);
  
  // TIMER CONTROLS - START, PAUSE, RESET, MODE CHANGE
  const handleStart = useCallback(() => {
    console.log('START called with mode:', timerMode, 'and time:', timeRemaining);
    
    // If we have a stored pause time, use it
    if (pausedTimeRef.current !== null) {
      console.log('Using stored pause time:', pausedTimeRef.current);
      setTimeRemaining(pausedTimeRef.current);
      
      // Clear the pause time after using it
      setTimeout(() => {
        pausedTimeRef.current = null;
      }, 100);
    }
    
    // Start the timer
    setIsRunning(true);
    
    // Save the timer state
    saveTimerState({
      timerMode,
      isRunning: true,
      timeRemaining: pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining,
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current || new Date().toISOString()
    });
  }, [timerMode, timeRemaining, setIsRunning, currentSessionIndex, saveTimerState]);
  
  const handlePause = useCallback(() => {
    console.log('PAUSE called with time:', timeRemaining);
    
    // Store the current time when pausing
    pausedTimeRef.current = timeRemaining;
    console.log('Storing exact pause time:', timeRemaining);
    
    // Stop the timer
    setIsRunning(false);
    
    // Save the timer state with the paused time
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: timeRemaining, // Use the current time exactly
      currentSessionIndex,
      sessionStartTime: sessionStartTimeRef.current
    });
  }, [timerMode, timeRemaining, currentSessionIndex, saveTimerState]);
  
  const handleReset = useCallback(() => {
    console.log('RESET called for mode:', timerMode);
    
    // Stop the timer
    setIsRunning(false);
    
    // Reset to the full time for current mode
    const newTime = getTotalTimeForMode();
    setTimeRemaining(newTime);
    
    // Clear session start time and pause time
    sessionStartTimeRef.current = null;
    pausedTimeRef.current = null;
    
    // Save the reset state
    saveTimerState({
      timerMode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex,
      sessionStartTime: null
    });
  }, [timerMode, getTotalTimeForMode, currentSessionIndex, saveTimerState]);
  
  const handleModeChange = useCallback((mode: TimerMode) => {
    console.log('MODE CHANGE called from', timerMode, 'to', mode);
    
    // Stop the timer first
    setIsRunning(false);
    
    // Update mode
    setTimerMode(mode);
    
    // Reset session index when manually changing to work mode
    if (mode === 'work') {
      setCurrentSessionIndex(0);
    }
    
    // Set the appropriate time for the new mode
    const newTime = (() => {
      switch(mode) {
        case 'work': return timerSettings.workDuration * 60;
        case 'break': return timerSettings.breakDuration * 60;
        case 'longBreak': return timerSettings.longBreakDuration * 60;
        default: return timerSettings.workDuration * 60;
      }
    })();
    
    setTimeRemaining(newTime);
    
    // Clear session start time and pause time
    sessionStartTimeRef.current = null;
    pausedTimeRef.current = null;
    
    // Save the new state
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : currentSessionIndex,
      sessionStartTime: null
    });
  }, [timerMode, timerSettings, currentSessionIndex, saveTimerState]);
  
  return {
    // Timer state
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions, 
    totalTimeToday,
    currentSessionIndex,
    progress,
    settings: timerSettings,
    
    // Timer actions
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    
    // Helper functions
    formatTime,
    getModeLabel
  };
};
