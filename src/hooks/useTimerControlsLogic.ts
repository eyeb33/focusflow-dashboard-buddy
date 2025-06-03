import { useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode, getTotalTime, savePartialSession } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { useTimerPauseResume } from './timer/useTimerPauseResume';

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
  
  // Use the dedicated pause/resume hook
  const {
    setPausedTime,
    getPausedTime,
    clearPausedTime,
    hasPausedTime,
    restorePausedTime
  } = useTimerPauseResume();

  // CRITICAL: Handle settings changes properly to not reset paused timer
  useEffect(() => {
    // Only reset timer when settings change if NOT running AND NOT paused
    const pausedTime = getPausedTime();
    const shouldPreserveTime = isRunning || pausedTime !== null;
    
    if (!shouldPreserveTime) {
      const newTime = getTotalTime(timerMode, settings);
      console.log(`Settings changed: Updating timer for ${timerMode} mode to ${newTime} seconds`);
      setTimeRemaining(newTime);
    } else {
      console.log("Settings changed but preserving current timer state:", {
        isRunning,
        hasPausedTime: pausedTime !== null,
        pausedTime
      });
    }
  }, [settings, timerMode, isRunning, getPausedTime, setTimeRemaining]);

  // Timer control functions
  const handleStart = (mode: TimerMode = timerMode) => {
    console.log("HANDLE START called - isRunning:", isRunning, "hasPausedTime:", hasPausedTime());
    
    // If the timer is already running, don't restart it
    if (isRunning) {
      console.log("Timer is already running, ignoring start call");
      return;
    }
    
    // CRITICAL: Check for paused time first
    const pausedTime = getPausedTime();
    if (pausedTime !== null) {
      console.log("Restoring paused time on start:", pausedTime);
      setTimeRemaining(pausedTime);
      lastRecordedTimeRef.current = pausedTime;
      // Don't clear paused time yet - wait for timer to actually start running
    } else {
      // Try to restore from localStorage
      const restoredTime = restorePausedTime();
      if (restoredTime !== null) {
        console.log("Restored time from localStorage:", restoredTime);
        setTimeRemaining(restoredTime);
        lastRecordedTimeRef.current = restoredTime;
      } else {
        // Save the current time to compare on pause
        lastRecordedTimeRef.current = timeRemaining;
      }
    }
    
    const totalTime = getTotalTime(mode, settings);
    const currentTime = getPausedTime() || timeRemaining;
    const elapsedSeconds = totalTime - currentTime;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    
    // Set session start time if it's not already set
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
      localStorage.setItem('sessionStartTime', sessionStartTimeRef.current);
      console.log("Set new session start time:", sessionStartTimeRef.current);
    }
    
    // CRITICAL: Set skipTimerResetRef to true BEFORE changing isRunning
    skipTimerResetRef.current = true;
    
    setIsRunning(true);
    
    // Clear paused time after starting
    clearPausedTime();
    
    console.log("Timer started with time remaining:", currentTime);
  };
  
  const handlePause = async () => {
    console.log("HANDLE PAUSE called with time remaining:", timeRemaining);
    
    // CRITICAL: Store the current time as paused time IMMEDIATELY before any other state changes
    console.log("Storing paused time:", timeRemaining);
    setPausedTime(timeRemaining);
    
    // CRITICAL: Set skipTimerResetRef to true BEFORE changing isRunning
    skipTimerResetRef.current = true;
    
    // Stop the timer
    setIsRunning(false);
    console.log("Timer paused - preserved time:", timeRemaining);
    
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
    clearPausedTime();
    
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
    
    // Reset the time
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
    
    skipTimerResetRef.current = false;
    localStorage.removeItem('timerState');
  };

  const handleModeChange = async (newMode: TimerMode) => {
    // Clear paused time when changing modes
    clearPausedTime();
    
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
    clearPausedTime();
    
    // Calculate the correct time for the current mode
    const newTime = getTotalTime(timerMode, settings);
    setTimeRemaining(newTime);
    
    // Reset recording refs
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    // Reset session start time
    sessionStartTimeRef.current = null;
    localStorage.removeItem('sessionStartTime');
    
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
    hasPausedTime,
    getPausedTime
  };
}
