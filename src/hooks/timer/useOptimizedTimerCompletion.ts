
import { useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { toast } from 'sonner';
import { OptimizedTimerState } from './useOptimizedTimerState';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface UseOptimizedTimerCompletionProps {
  state: OptimizedTimerState;
  setState: React.Dispatch<React.SetStateAction<OptimizedTimerState>>;
  settings: TimerSettings;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  lastRecordedFullMinutesRef: React.MutableRefObject<number>;
  isTransitioningRef: React.MutableRefObject<boolean>;
  saveTimerState: (state: Partial<OptimizedTimerState>) => void;
  onTimerComplete?: () => void;
}

export function useOptimizedTimerCompletion({
  state,
  setState,
  settings,
  sessionStartTimeRef,
  lastRecordedFullMinutesRef,
  isTransitioningRef,
  saveTimerState,
  onTimerComplete
}: UseOptimizedTimerCompletionProps) {
  
  const handleTimerCompletion = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      console.log('Timer completed for mode:', state.timerMode);
      
      // Show completion toast
      const modeLabel = state.timerMode === 'work' ? 'Focus' : 
                       state.timerMode === 'break' ? 'Break' : 'Long Break';
      toast.success(`${modeLabel} session completed!`);

      // Call external completion handler if provided
      if (onTimerComplete) {
        onTimerComplete();
      }

      if (state.timerMode === 'work') {
        // After work session - increment counters and determine next mode
        const newCompletedSessions = state.completedSessions + 1;
        const newSessionIndex = (state.currentSessionIndex + 1) % settings.sessionsUntilLongBreak;
        const shouldTakeLongBreak = newCompletedSessions % settings.sessionsUntilLongBreak === 0;
        const nextMode: TimerMode = shouldTakeLongBreak ? 'longBreak' : 'break';
        const nextTime = nextMode === 'longBreak' 
          ? settings.longBreakDuration * 60 
          : settings.breakDuration * 60;

        console.log(`Work completed. Sessions: ${newCompletedSessions}, Next mode: ${nextMode}`);

        setState(prev => ({
          ...prev,
          timerMode: nextMode,
          isRunning: true, // Auto-start break
          timeRemaining: nextTime,
          completedSessions: newCompletedSessions,
          totalTimeToday: prev.totalTimeToday + settings.workDuration,
          currentSessionIndex: newSessionIndex
        }));

        // Reset session tracking
        sessionStartTimeRef.current = new Date().toISOString();
        lastRecordedFullMinutesRef.current = 0;

      } else if (state.timerMode === 'break') {
        // After break - go back to work and auto-start
        const nextTime = settings.workDuration * 60;
        
        console.log('Break completed. Returning to work mode');

        setState(prev => ({
          ...prev,
          timerMode: 'work',
          isRunning: true, // Auto-start next work session
          timeRemaining: nextTime
        }));

        // Reset session tracking
        sessionStartTimeRef.current = new Date().toISOString();
        lastRecordedFullMinutesRef.current = 0;

      } else if (state.timerMode === 'longBreak') {
        // After long break - go back to work but DON'T auto-start
        const nextTime = settings.workDuration * 60;
        
        console.log('Long break completed. Returning to work mode (manual start required)');

        setState(prev => ({
          ...prev,
          timerMode: 'work',
          isRunning: false, // Don't auto-start after long break
          timeRemaining: nextTime,
          currentSessionIndex: 0 // Reset cycle
        }));

        // Reset session tracking
        sessionStartTimeRef.current = null;
        lastRecordedFullMinutesRef.current = 0;
      }

      saveTimerState(state);
      
    } finally {
      isTransitioningRef.current = false;
    }
  }, [state, settings, onTimerComplete, setState, sessionStartTimeRef, lastRecordedFullMinutesRef, isTransitioningRef, saveTimerState]);

  return { handleTimerCompletion };
}
