
import { useEffect, useRef } from 'react';
import { useTimerInterval } from './useTimerInterval';
import { useTimerPausedState } from './useTimerPausedState';
import { useTimerVisibilityHandler } from './useTimerVisibilityHandler';

interface UseTimerTickProps {
  isRunning: boolean;
  timeRemaining: number;
  timerMode: string;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  lastTickTimeRef: React.MutableRefObject<number>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  handleTimerComplete: () => void;
  saveTimerState: (state: any) => void;
  currentSessionIndex: number;
}

export function useTimerTick(props: UseTimerTickProps) {
  // Performance monitoring for debugging
  const renderTimestampRef = useRef(Date.now());
  const renderCount = useRef(0);
  
  // Reference to track if visibility handling has set up onVisibilityChange
  const visibilityHandlerSetupRef = useRef(false);
  
  // Debug logging with performance info
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const elapsed = now - renderTimestampRef.current;
    console.log(`useTimerTick - Render #${renderCount.current} after ${elapsed}ms - Current state: isRunning=${props.isRunning}, time=${props.timeRemaining}, pausedTime=${props.pausedTimeRef.current}`);
    renderTimestampRef.current = now;
  }, [props.isRunning, props.timeRemaining, props.pausedTimeRef]);
  
  // Set up the timer interval effect
  useTimerInterval(props);
  
  // Handle visibility change (tab switching)
  useTimerVisibilityHandler({
    isRunning: props.isRunning,
    timeRemaining: props.timeRemaining,
    setTimeRemaining: props.setTimeRemaining,
    lastTickTimeRef: props.lastTickTimeRef,
    handleTimerComplete: props.handleTimerComplete,
    timerMode: props.timerMode
  });
  
  // Set up visibility change handler in window context
  useEffect(() => {
    if (!visibilityHandlerSetupRef.current) {
      window.timerContext = {
        ...window.timerContext,
        onVisibilityChange: () => {
          console.log('Visibility change handler called. Current running state:', props.isRunning);
          // This handler can be called to force updates when visibility changes
          if (props.isRunning) {
            // Force a re-render by updating last tick time
            props.lastTickTimeRef.current = Date.now();
            
            // Also update document title to match current time
            if (window.timerContext && typeof window.timerContext.updateDocumentTitle === 'function') {
              window.timerContext.updateDocumentTitle();
            }
          }
        }
      };
      visibilityHandlerSetupRef.current = true;
    }

    // Update document title on each tick when timer is running
    let titleUpdateInterval: ReturnType<typeof setInterval> | null = null;
    
    if (props.isRunning) {
      titleUpdateInterval = setInterval(() => {
        if (window.timerContext && typeof window.timerContext.updateDocumentTitle === 'function') {
          window.timerContext.updateDocumentTitle();
        }
      }, 1000);
    }
    
    return () => {
      if (visibilityHandlerSetupRef.current) {
        if (window.timerContext) {
          window.timerContext.onVisibilityChange = undefined;
        }
        visibilityHandlerSetupRef.current = false;
      }
      
      if (titleUpdateInterval) {
        clearInterval(titleUpdateInterval);
      }
    };
  }, [props.isRunning, props.lastTickTimeRef, props.timeRemaining]);
  
  // Handle paused state persistence
  useTimerPausedState(props);
}
