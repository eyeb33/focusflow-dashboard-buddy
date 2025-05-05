
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
        }
        
        if (savedState.sessionStartTime) {
          sessionStartTimeRef.current = savedState.sessionStartTime;
        }
      }
      
      // Mark initial load as complete
      isInitialLoadRef.current = false;
    } catch (error) {
      console.error('Error loading saved timer state:', error);
      isInitialLoadRef.current = false;
    }
  }, [loadTimerState, setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef, isInitialLoadRef]);
}
