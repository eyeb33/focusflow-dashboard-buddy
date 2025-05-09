
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface SaveTimerStateParams {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  currentSessionIndex: number;
  sessionStartTime: string | null;
  pausedTime?: number | null;
}

export function useTimerPersistence() {
  // Save timer state to localStorage
  const saveTimerState = useCallback((state: SaveTimerStateParams) => {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now()
    };
    console.log(`Saving timer state:`, stateWithTimestamp);
    localStorage.setItem('timerState', JSON.stringify(stateWithTimestamp));
    
    // Always store the current timeRemaining as pausedTime when stopping
    if (!state.isRunning) {
      const timeToStore = state.pausedTime !== undefined ? state.pausedTime : state.timeRemaining;
      localStorage.setItem('pausedTime', timeToStore.toString());
      console.log(`Storing paused time in localStorage:`, timeToStore);
    } else if (state.isRunning) {
      // Only clear pausedTime when we're running
      localStorage.removeItem('pausedTime');
      console.log('Timer is running, clearing paused time');
    }
  }, []);
  
  // Load timer state from localStorage
  const loadTimerState = useCallback(() => {
    try {
      const savedStateJson = localStorage.getItem('timerState');
      if (!savedStateJson) {
        console.log("No timer state found in localStorage");
        return null;
      }
      
      const savedState = JSON.parse(savedStateJson);
      console.log("Loaded timer state from localStorage:", savedState);
      
      // Verify that loaded state has essential properties
      if (!savedState || 
          typeof savedState.timeRemaining !== 'number' || 
          !savedState.timerMode ||
          !savedState.timestamp) {
        console.log("Invalid timer state format, clearing");
        localStorage.removeItem('timerState');
        return null;
      }
      
      const now = Date.now();
      const elapsed = now - (savedState.timestamp || 0);
      
      // Only restore if recent (< 1 minute) and valid
      if (elapsed < 60000) {
        // Check if we have a paused time stored separately
        const pausedTimeStr = localStorage.getItem('pausedTime');
        if (pausedTimeStr && !savedState.isRunning) {
          const pausedTime = parseInt(pausedTimeStr, 10);
          if (!isNaN(pausedTime) && pausedTime > 0) {
            console.log("Found stored paused time:", pausedTime);
            savedState.timeRemaining = pausedTime;
            savedState.pausedTime = pausedTime;
          }
        }
        
        // Always force isRunning to false when restoring
        return {
          ...savedState,
          isRunning: false
        };
      }
      
      console.log("Timer state too old, clearing");
      localStorage.removeItem('timerState');
      localStorage.removeItem('pausedTime');
      return null;
    } catch (error) {
      console.error('Error loading saved timer state:', error);
      localStorage.removeItem('timerState');
      localStorage.removeItem('pausedTime');
      return null;
    }
  }, []);
  
  // Clear all timer state - useful for debugging and resetting
  const clearTimerState = useCallback(() => {
    console.log("Clearing all timer state from localStorage");
    localStorage.removeItem('timerState');
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('timerStateBeforeUnload');
    localStorage.removeItem('pausedTime');
  }, []);
  
  return {
    saveTimerState,
    loadTimerState,
    clearTimerState
  };
}
