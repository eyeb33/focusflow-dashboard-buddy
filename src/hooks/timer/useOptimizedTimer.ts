
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useOptimizedTimerState } from './useOptimizedTimerState';
import { useOptimizedTimerActions } from './useOptimizedTimerActions';
import { useOptimizedTimerCompletion } from './useOptimizedTimerCompletion';
import { useOptimizedTimerEffects } from './useOptimizedTimerEffects';
import { useOptimizedTimerPersistence } from './useOptimizedTimerPersistence';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface UseOptimizedTimerProps {
  settings: TimerSettings;
  onTimerComplete?: () => void;
}

export function useOptimizedTimer({ settings, onTimerComplete }: UseOptimizedTimerProps) {
  // Initialize state and refs
  const { state, setState, refs } = useOptimizedTimerState(settings);
  const {
    timerRef,
    lastTickTimeRef,
    sessionStartTimeRef,
    lastRecordedFullMinutesRef,
    targetEndTimeRef,
    isInitializedRef,
    isTransitioningRef
  } = refs;

  // Initialize persistence
  const { saveTimerState, loadTimerState } = useOptimizedTimerPersistence();

  // Initialize completion handling
  const { handleTimerCompletion } = useOptimizedTimerCompletion({
    state,
    setState,
    settings,
    sessionStartTimeRef,
    lastRecordedFullMinutesRef,
    isTransitioningRef,
    saveTimerState,
    onTimerComplete
  });

  // Initialize actions
  const {
    getTotalTimeForMode,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  } = useOptimizedTimerActions({
    state,
    setState,
    settings,
    timerRef,
    sessionStartTimeRef,
    lastRecordedFullMinutesRef,
    targetEndTimeRef,
    saveTimerState
  });

  // Initialize effects
  useOptimizedTimerEffects({
    state,
    setState,
    settings,
    timerRef,
    lastTickTimeRef,
    sessionStartTimeRef,
    lastRecordedFullMinutesRef,
    targetEndTimeRef,
    isInitializedRef,
    getTotalTimeForMode,
    handleTimerCompletion,
    saveTimerState,
    loadTimerState
  });

  // Progress calculation
  const progress = (getTotalTimeForMode() - state.timeRemaining) / getTotalTimeForMode() * 100;

  return {
    ...state,
    progress,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    getTotalTimeForMode
  };
}
