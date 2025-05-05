
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseTimerStateRestorationProps {
  loadTimerState: () => any;
  setTimerMode: (mode: TimerMode) => void;
  setTimeRemaining: (time: number) => void;
  setCurrentSessionIndex: (index: number) => void;
  pausedTimeRef: React.MutableRefObject<number | null>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  isInitialLoadRef: React.MutableRefObject<boolean>;
}

export function useTimerStateRestoration({
  loadTimerState,
  setTimerMode,
  setTimeRemaining,
  setCurrentSessionIndex,
  pausedTimeRef,
  sessionStartTimeRef,
  isInitialLoadRef
}: UseTimerStateRestorationProps) {
  // Load initial timer state
  useEffect(() => {
    if (!isInitialLoadRef.current) return;
    
    try {
      const savedState = loadTimerState();
      
      // Clear the initial load flag immediately to prevent conflicts
      isInitialLoadRef.current = false;
      
      if (savedState) {
        console.log('Restoring timer state from localStorage:', savedState);
        
        // Restore timer state but don't auto-start
        setTimerMode(savedState.timerMode || 'work');
        setTimeRemaining(savedState.timeRemaining);
        setCurrentSessionIndex(savedState.currentSessionIndex || 0);
        
        // Explicitly store the paused time
        if (!savedState.isRunning && savedState.timeRemaining) {
          console.log('Restoring exact paused time:', savedState.timeRemaining);
          pausedTimeRef.current = savedState.timeRemaining;
        } else {
          pausedTimeRef.current = null;
        }
        
        if (savedState.sessionStartTime) {
          sessionStartTimeRef.current = savedState.sessionStartTime;
        } else {
          sessionStartTimeRef.current = null;
        }
      } else {
        console.log('No saved timer state found, using defaults');
        // Reset to default state
        pausedTimeRef.current = null;
        sessionStartTimeRef.current = null;
      }
    } catch (error) {
      console.error('Error loading saved timer state:', error);
      isInitialLoadRef.current = false;
    }
  }, [loadTimerState, setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef, isInitialLoadRef]);
}
