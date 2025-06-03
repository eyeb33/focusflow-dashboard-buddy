
import { useRef, useCallback } from 'react';

export function useTimerPauseResume() {
  const pausedTimeRef = useRef<number | null>(null);
  const wasPausedRef = useRef<boolean>(false);
  
  const setPausedTime = useCallback((time: number) => {
    pausedTimeRef.current = time;
    wasPausedRef.current = true;
    console.log('Timer paused - storing time:', time);
    
    // Store in localStorage for persistence
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    timerState.pausedTime = time;
    timerState.wasPaused = true;
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, []);
  
  const getPausedTime = useCallback(() => {
    return pausedTimeRef.current;
  }, []);
  
  const clearPausedTime = useCallback(() => {
    pausedTimeRef.current = null;
    wasPausedRef.current = false;
    console.log('Cleared paused time');
    
    // Clear from localStorage
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    delete timerState.pausedTime;
    delete timerState.wasPaused;
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, []);
  
  const hasPausedTime = useCallback(() => {
    return pausedTimeRef.current !== null;
  }, []);
  
  const restorePausedTime = useCallback(() => {
    // Check localStorage for paused state
    const timerState = JSON.parse(localStorage.getItem('timerState') || '{}');
    if (timerState.pausedTime && timerState.wasPaused) {
      pausedTimeRef.current = timerState.pausedTime;
      wasPausedRef.current = true;
      console.log('Restored paused time from localStorage:', timerState.pausedTime);
      return timerState.pausedTime;
    }
    return null;
  }, []);
  
  return {
    setPausedTime,
    getPausedTime,
    clearPausedTime,
    hasPausedTime,
    restorePausedTime,
    pausedTimeRef,
    wasPausedRef
  };
}
