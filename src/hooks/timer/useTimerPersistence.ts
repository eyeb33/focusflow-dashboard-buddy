
import { useCallback, useEffect } from 'react';
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
  // Load initial state from localStorage
  const loadInitialState = useCallback(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        return {
          timerMode: parsed.timerMode || 'work',
          timeRemaining: parsed.timeRemaining !== undefined ? parsed.timeRemaining : settings.workDuration * 60,
          currentSessionIndex: parsed.currentSessionIndex !== undefined ? parsed.currentSessionIndex : 0,
          sessionStartTime: parsed.sessionStartTime || null,
        };
      } catch (e) {
        console.error('Error parsing timer state:', e);
      }
    }
    
    // Default state when no saved state exists
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
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      return JSON.parse(savedState) as TimerState;
    }
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
