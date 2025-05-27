
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode, getTotalTime, savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';

// Interface for the hook's parameters
interface UseTimerControlsLogicParams {
  timerMode: TimerMode;
  settings: TimerSettings;
  isRunning: boolean;
  timeRemaining: number;
  setIsRunning: (isRunning: boolean) => void;
  setTimeRemaining: (time: number) => void;
  setTimerMode: (mode: TimerMode) => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  skipTimerResetRef: React.MutableRefObject<boolean>;
  modeChangeInProgressRef: React.MutableRefObject<boolean>;
  setCurrentSessionIndex?: (index: number) => void;
}

export function useTimerControlsLogic({
  timerMode,
  settings,
  isRunning,
  timeRemaining,
  setIsRunning,
  setTimeRemaining,
  setTimerMode,
  sessionStartTimeRef,
  skipTimerResetRef,
  modeChangeInProgressRef,
  setCurrentSessionIndex
}: UseTimerControlsLogicParams) {
  const { user } = useAuth();
  const lastRecordedTimeRef = useRef<number | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);
  const timerStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // NEW: Add pausedTimeRef to track paused state
  const pausedTimeRef = useRef<number | null>(null);

  // Timer control functions
  const handleStart = (mode: TimerMode = timerMode) => {
    console.log("HANDLE START called in useTimerControlsLogic with mode:", mode, "isRunning:", isRunning);
    
    // If the timer is already running, don't restart it
    if (isRunning) {
      console.log("Timer is already running, ignoring start call");
      return;
    }
    
    // CRITICAL: If we have a paused time, restore it
    if (pausedTimeRef.current !== null) {
      console.log("Restoring paused time on start:", pausedTimeRef.current);
      setTimeRemaining(pausedTimeRef.current);
      lastRecordedTimeRef.current = pausedTimeRef.current;
      // Clear the paused time since we're resuming
      pausedTimeRef.current = null;
    } else {
      // Save the current time to compare on pause
      lastRecordedTimeRef.current = timeRemaining;
    }
    
    const totalTime = getTotalTime(mode, settings);
    const currentTime = pausedTimeRef.current !== null ? pausedTimeRef.current : timeRemaining;
    const elapsedSeconds = totalTime - currentTime;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    
    // Set session start time if it's not already set
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
      localStorage.setItem('sessionStartTime', sessionStartTimeRef.current);
      console.log("Set new session start time:", sessionStartTimeRef.current);
    }
    
    // Start the timer without changing timeRemaining
    console.log("Setting isRunning to TRUE with time remaining:", currentTime);
    
    // CRITICAL: Set skipTimerResetRef to true BEFORE changing isRunning
    // This prevents any listeners from resetting the timer
    skipTimerResetRef.current = true;
    
    setIsRunning(true);
    
    // Save the timer state to localStorage for persistence
    const timerState = {
      isRunning: true,
      timerMode: mode,
      timeRemaining: currentTime,
      totalTime: getTotalTime(mode, settings),
      timestamp: Date.now(),
      sessionStartTime: sessionStartTimeRef.current
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
    
    console.log("Timer started at:", currentTime, "seconds with mode:", mode);
  };
  
  const handlePause = async () => {
    console.log("HANDLE PAUSE called with time remaining:", timeRemaining);
    
    // CRITICAL: Store the current time as paused time BEFORE any state changes
    pausedTimeRef.current = timeRemaining;
    console.log("Stored paused time:", pausedTimeRef.current);
    
    // CRITICAL: Set skipTimerResetRef to true BEFORE changing isRunning
    // This prevents any listeners from resetting the timer
    skipTimerResetRef.current = true;
    
    // Store current time in localStorage BEFORE changing any state
    const timerState = {
      isRunning: false,
      timerMode,
      timeRemaining: timeRemaining, // Use the current timeRemaining directly
      totalTime: getTotalTime(timerMode, settings),
      timestamp: Date.now(),
      sessionStartTime: sessionStartTimeRef.current,
      pausedTime: timeRemaining // Store paused time for restoration
    };
    
    console.log("Saving paused timer state with exact time:", timerState);
    localStorage.setItem('timerState', JSON.stringify(timerState));
    
    // Only after saving state, stop the timer
    setIsRunning(false);
    console.log("Timer paused at:", timeRemaining, "seconds - PRESERVING paused time:", pausedTimeRef.current);
    
    // Save partial session if user is logged in
    if (user && lastRecordedTimeRef.current) {
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
    // Clear paused time on reset
    pausedTimeRef.current = null;
    
    // Stop the timer
    setIsRunning(false);
    
    // Save partial session if user is logged in
    if (user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    
    // Reset the time - CRITICAL: we always want to reset here
    const newTime = getTotalTime(timerMode, settings);
    setTimeRemaining(newTime);
    lastRecordedTimeRef.current = newTime;
    lastRecordedFullMinutesRef.current = 0;
    console.log("Timer RESET to:", newTime, "seconds");
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    localStorage.removeItem('sessionStartTime');
    
    // Reset the current session index when timer is reset
    if (timerMode === 'work' && setCurrentSessionIndex) {
      setCurrentSessionIndex(0);
    }
    
    // Important: We're intentionally resetting, so don't skip the reset
    skipTimerResetRef.current = false;
    
    // Clear paused time from localStorage
    localStorage.removeItem('timerState');
  };

  const handleModeChange = async (newMode: TimerMode) => {
    // Clear paused time when changing modes
    pausedTimeRef.current = null;
    
    // Save session if the timer was running
    if (isRunning && user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    
    // Stop the timer when changing modes
    setIsRunning(false);
    
    // Reset tracking
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    localStorage.removeItem('sessionStartTime');
    
    // Set new time according to the new mode
    const newTime = getTotalTime(newMode, settings);
    setTimeRemaining(newTime);
    console.log(`Timer mode changed to ${newMode} with time:`, newTime, "seconds");
    
    // Reset the current session index when manually changing modes
    if (newMode === 'work' && setCurrentSessionIndex) {
      setCurrentSessionIndex(0);
    }
    
    // Finally, change the timer mode
    setTimerMode(newMode);
    
    // Important: Don't skip the reset when changing modes
    skipTimerResetRef.current = false;
    
    // Save the timer state to localStorage for persistence
    const timerState = {
      isRunning: false,
      timerMode: newMode,
      timeRemaining: newTime,
      totalTime: newTime,
      timestamp: Date.now(),
      sessionStartTime: null
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  };

  const resetTimerState = () => {
    // Clear paused time on reset
    pausedTimeRef.current = null;
    
    // Calculate the correct time for the current mode
    const newTime = getTotalTime(timerMode, settings);
    setTimeRemaining(newTime);
    
    // Reset recording refs
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    localStorage.removeItem('sessionStartTime');
    
    // Important: We're intentionally resetting, so don't skip the reset
    skipTimerResetRef.current = false;
    
    console.log("Timer state reset to:", newTime, "seconds for mode:", timerMode);
  };

  return {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    lastRecordedFullMinutesRef,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    resetTimerState,
    pausedTimeRef // Export pausedTimeRef for other hooks that need it
  };
}
