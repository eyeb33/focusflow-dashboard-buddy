
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
      if (!savedStateJson) return null;
      
      const savedState = JSON.parse(savedStateJson);
      const now = Date.now();
      const elapsed = now - (savedState.timestamp || 0);
      
      // Only restore if recent (< 30 minutes) and valid
      if (elapsed < 1800000 && typeof savedState.timeRemaining === 'number') {
        // Always force isRunning to false when restoring
        return {
          ...savedState,
          isRunning: false
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading saved timer state:', error);
      return null;
    }
  }, []);
  
  return {
    saveTimerState,
    loadTimerState
  };
}
