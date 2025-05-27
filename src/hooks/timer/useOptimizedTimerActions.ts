
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { OptimizedTimerState } from './useOptimizedTimerState';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface UseOptimizedTimerActionsProps {
  state: OptimizedTimerState;
  setState: React.Dispatch<React.SetStateAction<OptimizedTimerState>>;
  settings: TimerSettings;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  lastRecordedFullMinutesRef: React.MutableRefObject<number>;
  targetEndTimeRef: React.MutableRefObject<number | null>;
  saveTimerState: (state: Partial<OptimizedTimerState>) => void;
}

export function useOptimizedTimerActions({
  state,
  setState,
  settings,
  timerRef,
  sessionStartTimeRef,
  lastRecordedFullMinutesRef,
  targetEndTimeRef,
  saveTimerState
}: UseOptimizedTimerActionsProps) {

  // Calculate total time for current mode
  const getTotalTimeForMode = useCallback(() => {
    switch(state.timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  }, [state.timerMode, settings]);

  const handleStart = useCallback(() => {
    console.log('Starting timer with time remaining:', state.timeRemaining);
    
    setState(prev => ({ ...prev, isRunning: true }));
    
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    
    saveTimerState({ ...state, isRunning: true });
  }, [state, setState, sessionStartTimeRef, saveTimerState]);

  const handlePause = useCallback(() => {
    console.log('Pausing timer at time:', state.timeRemaining);
    
    setState(prev => ({ ...prev, isRunning: false }));
    saveTimerState({ ...state, isRunning: false });
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
  }, [state, setState, timerRef, targetEndTimeRef, saveTimerState]);

  const handleReset = useCallback(() => {
    console.log('Resetting timer for mode:', state.timerMode);
    
    const newTime = getTotalTimeForMode();
    
    setState(prev => ({ 
      ...prev, 
      isRunning: false, 
      timeRemaining: newTime 
    }));
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
    
    saveTimerState({ 
      ...state, 
      isRunning: false, 
      timeRemaining: newTime 
    });
  }, [state, setState, getTotalTimeForMode, timerRef, sessionStartTimeRef, lastRecordedFullMinutesRef, targetEndTimeRef, saveTimerState]);

  const handleModeChange = useCallback((mode: TimerMode) => {
    console.log('Changing mode from', state.timerMode, 'to', mode);
    
    const newTime = (() => {
      switch(mode) {
        case 'work': return settings.workDuration * 60;
        case 'break': return settings.breakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
        default: return settings.workDuration * 60;
      }
    })();
    
    setState(prev => ({
      ...prev,
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : prev.currentSessionIndex
    }));
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
    
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : state.currentSessionIndex
    });
  }, [state, setState, settings, timerRef, sessionStartTimeRef, lastRecordedFullMinutesRef, targetEndTimeRef, saveTimerState]);

  return {
    getTotalTimeForMode,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
