
import { useRef, useCallback } from 'react';

export function useTimerSessionTracking() {
  const sessionStartTimeRef = useRef<string | null>(null);
  
  const setSessionStartTime = useCallback((time: string | null) => {
    sessionStartTimeRef.current = time;
    
    // Also save to localStorage for persistence across refreshes
    if (time) {
      localStorage.setItem('sessionStartTime', time);
    } else {
      localStorage.removeItem('sessionStartTime');
    }
  }, []);
  
  return {
    sessionStartTimeRef,
    setSessionStartTime
  };
}
