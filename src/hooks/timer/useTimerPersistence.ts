
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface SaveTimerStateParams {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  currentSessionIndex: number;
  sessionStartTime: string | null;
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
      if (!savedState || typeof savedState.timeRemaining !== 'number') {
        console.log("Invalid timer state format, clearing");
        localStorage.removeItem('timerState');
        return null;
      }
      
      const now = Date.now();
      const elapsed = now - (savedState.timestamp || 0);
      
      // Only restore if recent (< 30 minutes) and valid
      if (elapsed < 1800000) {
        // Always force isRunning to false when restoring
        return {
          ...savedState,
          isRunning: false
        };
      }
      
      console.log("Timer state too old, clearing");
      localStorage.removeItem('timerState');
      return null;
    } catch (error) {
      console.error('Error loading saved timer state:', error);
      localStorage.removeItem('timerState');
      return null;
    }
  }, []);
  
  // Clear all timer state - useful for debugging and resetting
  const clearTimerState = useCallback(() => {
    console.log("Clearing all timer state from localStorage");
    localStorage.removeItem('timerState');
    localStorage.removeItem('sessionStartTime');
    localStorage.removeItem('timerStateBeforeUnload');
  }, []);
  
  return {
    saveTimerState,
    loadTimerState,
    clearTimerState
  };
}
