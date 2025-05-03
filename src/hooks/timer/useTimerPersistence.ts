
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
  // Always start with a fresh state on page load
  const loadInitialState = useCallback(() => {
    console.log("Initializing with fresh timer state");
    
    // Default state when no saved state exists or on page refresh
    return {
      timerMode: 'work' as TimerMode,
      timeRemaining: settings.workDuration * 60,
      currentSessionIndex: 0,
      sessionStartTime: null
    };
  }, [settings]);
  
  // Initialize with correct values
  const initialState = loadInitialState();
  
  const saveTimerState = useCallback((state: TimerState) => {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem('timerState', JSON.stringify(stateWithTimestamp));
    console.log("Saved timer state:", stateWithTimestamp);
  }, []);
  
  const loadTimerState = useCallback(() => {
    // For this fix, we're not loading saved state on page refresh
    return null;
  }, []);
  
  return {
    saveTimerState,
    loadTimerState,
    initialTimerMode: initialState.timerMode,
    initialTimeRemaining: initialState.timeRemaining,
    initialSessionIndex: initialState.currentSessionIndex,
    initialSessionStartTime: initialState.sessionStartTime
  };
}
