
import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useAuth } from '@/contexts/AuthContext';
import { savePartialSession } from '@/utils/timerContextUtils';
import { trackTimerTick } from '@/utils/debugUtils';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface OptimizedTimerState {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  completedSessions: number;
  totalTimeToday: number;
  currentSessionIndex: number;
}

interface UseOptimizedTimerProps {
  settings: TimerSettings;
  onTimerComplete?: () => void;
}

export function useOptimizedTimer({ settings, onTimerComplete }: UseOptimizedTimerProps) {
  const { user } = useAuth();
  
  // Consolidated state
  const [state, setState] = useState<OptimizedTimerState>({
    timerMode: 'work',
    isRunning: false,
    timeRemaining: settings.workDuration * 60,
    completedSessions: 0,
    totalTimeToday: 0,
    currentSessionIndex: 0
  });

  // Refs for timer management
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<string | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);
  const targetEndTimeRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  // Calculate total time for current mode
  const getTotalTimeForMode = useCallback(() => {
    switch(state.timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  }, [state.timerMode, settings]);

  // Progress calculation
  const progress = (getTotalTimeForMode() - state.timeRemaining) / getTotalTimeForMode() * 100;

  // Persistence functions
  const saveTimerState = useCallback((timerState: Partial<OptimizedTimerState>) => {
    const stateToSave = {
      ...timerState,
      timestamp: Date.now(),
      sessionStartTime: sessionStartTimeRef.current
    };
    localStorage.setItem('timerState', JSON.stringify(stateToSave));
  }, []);

  const loadTimerState = useCallback(() => {
    try {
      const saved = localStorage.getItem('timerState');
      if (!saved) return null;
      
      const parsedState = JSON.parse(saved);
      const now = Date.now();
      const elapsed = now - (parsedState.timestamp || 0);
      
      // Only restore if less than 30 minutes old
      if (elapsed < 1800000) {
        return parsedState;
      }
      
      localStorage.removeItem('timerState');
      return null;
    } catch (error) {
      console.error('Error loading timer state:', error);
      localStorage.removeItem('timerState');
      return null;
    }
  }, []);

  // Timer controls
  const handleStart = useCallback(() => {
    console.log('Starting timer with time remaining:', state.timeRemaining);
    
    setState(prev => ({ ...prev, isRunning: true }));
    
    if (!sessionStartTimeRef.current) {
      sessionStartTimeRef.current = new Date().toISOString();
    }
    
    saveTimerState({ ...state, isRunning: true });
  }, [state, saveTimerState]);

  const handlePause = useCallback(() => {
    console.log('Pausing timer at time:', state.timeRemaining);
    
    setState(prev => ({ ...prev, isRunning: false }));
    saveTimerState({ ...state, isRunning: false });
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
  }, [state, saveTimerState]);

  const handleReset = useCallback(() => {
    console.log('Resetting timer for mode:', state.timerMode);
    
    const newTime = getTotalTimeForMode();
    
    setState(prev => ({ 
      ...prev, 
      isRunning: false, 
      timeRemaining: newTime 
    }));
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
    
    saveTimerState({ 
      ...state, 
      isRunning: false, 
      timeRemaining: newTime 
    });
  }, [state, getTotalTimeForMode, saveTimerState]);

  const handleModeChange = useCallback((mode: TimerMode) => {
    console.log('Changing mode from', state.timerMode, 'to', mode);
    
    const newTime = (() => {
      switch(mode) {
        case 'work': return settings.workDuration * 60;
        case 'break': return settings.breakDuration * 60;
        case 'longBreak': return settings.longBreakDuration * 60;
        default: return settings.workDuration * 60;
      }
    })();
    
    setState(prev => ({
      ...prev,
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : prev.currentSessionIndex
    }));
    
    sessionStartTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      targetEndTimeRef.current = null;
    }
    
    saveTimerState({
      timerMode: mode,
      isRunning: false,
      timeRemaining: newTime,
      currentSessionIndex: mode === 'work' ? 0 : state.currentSessionIndex
    });
  }, [state, settings, saveTimerState]);

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
              
              // Call completion handler
              if (onTimerComplete) {
                setTimeout(() => onTimerComplete(), 0);
              }
              
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
  }, [state.isRunning, state.timeRemaining, user, getTotalTimeForMode, onTimerComplete, saveTimerState]);

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
        isRunning: false // Always start paused for safety
      }));
      
      if (savedState.sessionStartTime) {
        sessionStartTimeRef.current = savedState.sessionStartTime;
      }
    }
    
    isInitializedRef.current = true;
  }, [loadTimerState, getTotalTimeForMode]);

  // Update time when settings change (but only if not running)
  useEffect(() => {
    if (!state.isRunning && isInitializedRef.current) {
      const newTime = getTotalTimeForMode();
      setState(prev => ({ ...prev, timeRemaining: newTime }));
    }
  }, [settings, state.isRunning, getTotalTimeForMode]);

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
            if (newTime === 0 && onTimerComplete) {
              setTimeout(() => onTimerComplete(), 0);
            }
            return { ...prev, timeRemaining: newTime };
          });
        }
        
        lastTickTimeRef.current = now;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isRunning, onTimerComplete]);

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
