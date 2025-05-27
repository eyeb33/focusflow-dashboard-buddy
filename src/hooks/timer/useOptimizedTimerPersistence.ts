
import { useCallback } from 'react';
import { OptimizedTimerState } from './useOptimizedTimerState';

export function useOptimizedTimerPersistence() {
  // Persistence functions
  const saveTimerState = useCallback((timerState: Partial<OptimizedTimerState>) => {
    const stateToSave = {
      ...timerState,
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(stateToSave));
  }, []);

  const loadTimerState = useCallback(() => {
    try {
      const saved = localStorage.getItem('timerState');
      if (!saved) return null;
      
      const parsedState = JSON.parse(saved);
      const now = Date.now();
      const elapsed = now - (parsedState.timestamp || 0);
      
      // Only restore if less than 30 minutes old
      if (elapsed < 1800000) {
        return parsedState;
      }
      
      localStorage.removeItem('timerState');
      return null;
    } catch (error) {
      console.error('Error loading timer state:', error);
      localStorage.removeItem('timerState');
      return null;
    }
  }, []);

  return {
    saveTimerState,
    loadTimerState
  };
}
