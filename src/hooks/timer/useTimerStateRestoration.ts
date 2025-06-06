
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
    
    console.log("==== TIMER STATE RESTORATION: Initial load detected ====");
    
    try {
      const savedState = loadTimerState();
      
      // Clear the initial load flag immediately to prevent conflicts
      isInitialLoadRef.current = false;
      
      if (savedState && savedState.timestamp) {
        const now = Date.now();
        const elapsed = now - savedState.timestamp;
        
        // Only restore if the saved state is recent (less than 30 minutes old)
        if (elapsed < 1800000) {
          console.log('Restoring timer state from localStorage:', savedState);
          
          // Restore timer state but don't auto-start
          setTimerMode(savedState.timerMode || 'work');
          setTimeRemaining(savedState.timeRemaining);
          setCurrentSessionIndex(savedState.currentSessionIndex || 0);
          
          // Handle paused time restoration
          if (savedState.pausedTime !== undefined && savedState.pausedTime !== null) {
            console.log('Restoring explicit paused time:', savedState.pausedTime);
            pausedTimeRef.current = savedState.pausedTime;
          } else if (!savedState.isRunning && savedState.timeRemaining) {
            console.log('Restoring timeRemaining as paused time:', savedState.timeRemaining);
            pausedTimeRef.current = savedState.timeRemaining;
          } else {
            pausedTimeRef.current = null;
          }
          
          if (savedState.sessionStartTime) {
            sessionStartTimeRef.current = savedState.sessionStartTime;
          } else {
            sessionStartTimeRef.current = null;
          }
          
          // Double-check that restored state is correct
          console.log('State restoration complete:', {
            timeRemaining: savedState.timeRemaining,
            pausedTime: pausedTimeRef.current,
            isRunning: false
          });
        } else {
          console.log('Saved state is too old, using defaults');
          resetToDefaults(setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef);
        }
      } else {
        console.log('No valid saved timer state found, using defaults');
        resetToDefaults(setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef);
      }
    } catch (error) {
      console.error('Error loading saved timer state:', error);
      isInitialLoadRef.current = false;
      resetToDefaults(setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef);
    }
  }, [loadTimerState, setTimerMode, setTimeRemaining, setCurrentSessionIndex, pausedTimeRef, sessionStartTimeRef, isInitialLoadRef]);
}

function resetToDefaults(
  setTimerMode: (mode: TimerMode) => void,
  setTimeRemaining: (time: number) => void,
  setCurrentSessionIndex: (index: number) => void,
  pausedTimeRef: React.MutableRefObject<number | null>,
  sessionStartTimeRef: React.MutableRefObject<string | null>
) {
  // Reset to default state
  setTimerMode('work');
  setTimeRemaining(25 * 60); // Default 25 minutes
  setCurrentSessionIndex(0);
  pausedTimeRef.current = null;
  sessionStartTimeRef.current = null;
  
  // Clear all timer state from localStorage
  localStorage.removeItem('timerState');
  localStorage.removeItem('sessionStartTime');
  localStorage.removeItem('timerStateBeforeUnload');
  localStorage.removeItem('pausedTime');
  
  console.log('Timer reset to default values');
}
