
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { debugTimerEvent } from '@/utils/timerDebugUtils';

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
        debugTimerEvent('useTimerStateRestoration', 'Restoring timer state', savedState);
        
        // Restore timer state but don't auto-start
        setTimerMode(savedState.timerMode || 'work');
        setTimeRemaining(savedState.timeRemaining);
        setCurrentSessionIndex(savedState.currentSessionIndex || 0);
        
        // Explicitly store the paused time if timer was not running
        if (!savedState.isRunning && savedState.timeRemaining > 0) {
          debugTimerEvent('useTimerStateRestoration', 'Restoring exact paused time', savedState.timeRemaining);
          pausedTimeRef.current = savedState.timeRemaining;
        } else {
          pausedTimeRef.current = null;
          debugTimerEvent('useTimerStateRestoration', 'No paused time to restore, setting to null', null);
        }
        
        if (savedState.sessionStartTime) {
          sessionStartTimeRef.current = savedState.sessionStartTime;
          debugTimerEvent('useTimerStateRestoration', 'Restored session start time', savedState.sessionStartTime);
        } else {
          sessionStartTimeRef.current = null;
        }
      } else {
        debugTimerEvent('useTimerStateRestoration', 'No saved timer state found, using defaults', null);
        // Reset to default state
        pausedTimeRef.current = null;
        sessionStartTimeRef.current = null;
      }
    } catch (error) {
      console.error('[useTimerStateRestoration] Error loading saved timer state:', error);
      isInitialLoadRef.current = false;
    }
  }, [loadTimerState, setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef, isInitialLoadRef]);
}
