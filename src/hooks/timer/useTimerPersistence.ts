
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { debugTimerEvent } from '@/utils/timerDebugUtils';

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
    debugTimerEvent('useTimerPersistence', 'Saving timer state', stateWithTimestamp);
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
        debugTimerEvent('useTimerPersistence', 'Loaded valid timer state', savedState);
        return savedState;
      }
      
      debugTimerEvent('useTimerPersistence', 'Saved state expired or invalid', { 
        elapsed, 
        valid: typeof savedState.timeRemaining === 'number' 
      });
      return null;
    } catch (error) {
      console.error('[useTimerPersistence] Error loading saved timer state:', error);
      return null;
    }
  }, []);
  
  return {
    saveTimerState,
    loadTimerState
  };
}
