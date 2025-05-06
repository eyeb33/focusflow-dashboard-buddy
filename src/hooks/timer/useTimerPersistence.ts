
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { debugTimerEvent } from '@/utils/timerDebugUtils';

interface SaveTimerStateParams {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  currentSessionIndex: number;
  sessionStartTime: string | null;
  isPaused?: boolean; // Added explicit isPaused flag
}

export function useTimerPersistence() {
  // Save timer state to localStorage
  const saveTimerState = useCallback((state: SaveTimerStateParams) => {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
      // Add explicit paused flag to make the state clearer
      isPaused: state.isPaused || (!state.isRunning && state.timeRemaining > 0)
    };
    
    debugTimerEvent('useTimerPersistence', 'Saving timer state', stateWithTimestamp);
    
    // Check if we're saving an explicit pause state
    if (stateWithTimestamp.isPaused) {
      debugTimerEvent('useTimerPersistence', 'Saving PAUSED timer state with time', state.timeRemaining);
    }
    
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
        
        // Check if this was a paused timer state
        if (savedState.isPaused || (!savedState.isRunning && savedState.timeRemaining > 0)) {
          debugTimerEvent('useTimerPersistence', 'Restoring PAUSED timer with exact time', savedState.timeRemaining);
        }
        
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
