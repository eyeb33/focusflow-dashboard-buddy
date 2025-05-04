
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '../useTimerSettings';

interface TimerState {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  currentSessionIndex: number;
  sessionStartTime: string | null;
  timestamp?: number;
}

export function useTimerPersistence(settings: TimerSettings) {
  // Load initial state - critical for proper timer functioning
  const loadInitialState = useCallback(() => {
    console.log("Checking for saved timer state");
    
    // Try to load saved state
    const savedStateJson = localStorage.getItem('timerState');
    
    if (savedStateJson) {
      try {
        const savedState = JSON.parse(savedStateJson);
        const now = Date.now();
        const elapsed = now - (savedState.timestamp || 0);
        
        console.log("Found saved timer state:", savedState);
        
        // Only restore state if it's valid and recent (< 30 minutes old)
        if (savedState && 
            typeof savedState.timeRemaining === 'number' && 
            elapsed < 1800000) { // 30 minutes
          
          console.log("Restoring timer state with time:", savedState.timeRemaining);
          
          // CRITICAL: preserve the exact timeRemaining value
          return {
            timerMode: savedState.timerMode || 'work',
            timeRemaining: savedState.timeRemaining,
            currentSessionIndex: savedState.currentSessionIndex || 0,
            sessionStartTime: savedState.sessionStartTime,
            isRunning: false // Always start paused when restoring
          };
        } else {
          console.log("Saved state expired or invalid, using fresh state");
        }
      } catch (error) {
        console.error("Error parsing saved timer state:", error);
      }
    }
    
    // Default state when no saved state exists or it's invalid
    return {
      timerMode: 'work' as TimerMode,
      timeRemaining: settings.workDuration * 60,
      currentSessionIndex: 0,
      sessionStartTime: null,
      isRunning: false
    };
  }, [settings]);
  
  // Initialize with correct values
  const initialState = loadInitialState();
  
  // Save the timer state
  const saveTimerState = useCallback((state: TimerState) => {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now()
    };
    
    // Log the exact time being saved for debugging
    console.log(`Saving timer state with exact time: ${state.timeRemaining} seconds`);
    
    localStorage.setItem('timerState', JSON.stringify(stateWithTimestamp));
  }, []);
  
  // Load timer state - used for restoring after tab/window refresh
  const loadTimerState = useCallback(() => {
    const savedStateJson = localStorage.getItem('timerState');
    if (savedStateJson) {
      try {
        const savedState = JSON.parse(savedStateJson);
        const now = Date.now();
        const elapsed = now - (savedState.timestamp || 0);
        
        // Only restore if the saved state is recent (< 30 minutes)
        if (elapsed < 1800000) { // 30 minutes
          return {
            ...savedState,
            isRunning: false // Always start paused when restoring
          };
        }
      } catch (error) {
        console.error("Error parsing saved timer state:", error);
      }
    }
    return null;
  }, []);
  
  return {
    saveTimerState,
    loadTimerState,
    initialTimerMode: initialState.timerMode,
    initialTimeRemaining: initialState.timeRemaining,
    initialSessionIndex: initialState.currentSessionIndex,
    initialSessionStartTime: initialState.sessionStartTime,
    initialIsRunning: initialState.isRunning
  };
}
