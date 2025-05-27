
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { savePartialSession } from '@/utils/timerContextUtils';
import { trackTimerTick } from '@/utils/debugUtils';
import { OptimizedTimerState } from './useOptimizedTimerState';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface UseOptimizedTimerEffectsProps {
  state: OptimizedTimerState;
  setState: React.Dispatch<React.SetStateAction<OptimizedTimerState>>;
  settings: TimerSettings;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  lastTickTimeRef: React.MutableRefObject<number>;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  lastRecordedFullMinutesRef: React.MutableRefObject<number>;
  targetEndTimeRef: React.MutableRefObject<number | null>;
  isInitializedRef: React.MutableRefObject<boolean>;
  getTotalTimeForMode: () => number;
  handleTimerCompletion: () => void;
  saveTimerState: (state: Partial<OptimizedTimerState>) => void;
  loadTimerState: () => any;
}

export function useOptimizedTimerEffects({
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
}: UseOptimizedTimerEffectsProps) {
  
  const { user } = useAuth();

  // Timer tick logic
  useEffect(() => {
    if (!state.isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        targetEndTimeRef.current = null;
      }
      return;
    }

    const now = Date.now();
    lastTickTimeRef.current = now;
    targetEndTimeRef.current = now + (state.timeRemaining * 1000);

    timerRef.current = setInterval(() => {
      const currentTime = Date.now();
      
      if (targetEndTimeRef.current !== null) {
        const remainingMs = targetEndTimeRef.current - currentTime;
        const newSecondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
        
        setState(prev => {
          if (newSecondsRemaining !== prev.timeRemaining) {
            // Handle timer completion
            if (newSecondsRemaining <= 0) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                targetEndTimeRef.current = null;
              }
              
              // Trigger completion handling
              setTimeout(() => handleTimerCompletion(), 0);
              
              return { ...prev, isRunning: false, timeRemaining: 0 };
            }

            // Save partial session at minute boundaries
            if (user && prev.timerMode === 'work') {
              const totalTime = getTotalTimeForMode();
              const elapsedSeconds = totalTime - newSecondsRemaining;
              const newFullMinutes = Math.floor(elapsedSeconds / 60);
              
              if (newFullMinutes > lastRecordedFullMinutesRef.current) {
                const startDate = sessionStartTimeRef.current
                  ? new Date(sessionStartTimeRef.current).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0];

                savePartialSession(
                  user.id,
                  prev.timerMode,
                  totalTime,
                  newSecondsRemaining,
                  lastRecordedFullMinutesRef.current,
                  startDate
                );
                
                lastRecordedFullMinutesRef.current = newFullMinutes;
              }
            }

            // Save state periodically
            if (newSecondsRemaining % 10 === 0) {
              saveTimerState({ 
                ...prev, 
                timeRemaining: newSecondsRemaining,
                isRunning: true 
              });
            }

            // Track tick for debugging
            trackTimerTick(prev.timeRemaining, newSecondsRemaining, prev.timerMode, currentTime);
            
            return { ...prev, timeRemaining: newSecondsRemaining };
          }
          return prev;
        });
      }
    }, 200);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isRunning, state.timeRemaining, user, getTotalTimeForMode, handleTimerCompletion, saveTimerState, setState, timerRef, lastTickTimeRef, targetEndTimeRef, sessionStartTimeRef, lastRecordedFullMinutesRef]);

  // Initialize from saved state
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const savedState = loadTimerState();
    if (savedState) {
      setState(prev => ({
        ...prev,
        timerMode: savedState.timerMode || 'work',
        timeRemaining: savedState.timeRemaining || getTotalTimeForMode(),
        currentSessionIndex: savedState.currentSessionIndex || 0,
        completedSessions: savedState.completedSessions || 0,
        totalTimeToday: savedState.totalTimeToday || 0,
        isRunning: false // Always start paused for safety
      }));
      
      if (savedState.sessionStartTime) {
        sessionStartTimeRef.current = savedState.sessionStartTime;
      }
    }
    
    isInitializedRef.current = true;
  }, [loadTimerState, getTotalTimeForMode, setState, sessionStartTimeRef, isInitializedRef]);

  // Update time when settings change (but only if not running)
  useEffect(() => {
    if (!state.isRunning && isInitializedRef.current) {
      const newTime = getTotalTimeForMode();
      setState(prev => ({ ...prev, timeRemaining: newTime }));
    }
  }, [settings, state.isRunning, getTotalTimeForMode, setState, isInitializedRef]);

  // Visibility change handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!state.isRunning) return;
      
      if (document.hidden) {
        lastTickTimeRef.current = Date.now();
      } else {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastTickTimeRef.current) / 1000);
        
        if (elapsedSeconds > 1) {
          setState(prev => {
            const newTime = Math.max(0, prev.timeRemaining - elapsedSeconds);
            if (newTime === 0) {
              setTimeout(() => handleTimerCompletion(), 0);
            }
            return { ...prev, timeRemaining: newTime };
          });
        }
        
        lastTickTimeRef.current = now;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isRunning, handleTimerCompletion, setState, lastTickTimeRef]);
}
