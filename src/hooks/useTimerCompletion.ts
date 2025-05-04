
import { useAuth } from '@/contexts/AuthContext';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from './useTimerSettings';
import { useRef } from 'react';
import { useTimerSessionTracking } from './timer/useTimerSessionTracking';
import { useTimerSessionPersistence } from './timer/useTimerSessionPersistence';
import { useTimerCycleManager } from './timer/useTimerCycleManager';
import { useTimerCompletionHandling } from './timer/useTimerCompletionHandling';

interface UseTimerCompletionProps {
  timerMode: TimerMode;
  settings: TimerSettings;
  completedSessions: number;
  currentSessionIndex: number;
  setCompletedSessions: React.Dispatch<React.SetStateAction<number>>;
  setTimerMode: React.Dispatch<React.SetStateAction<TimerMode>>;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalTimeToday: React.Dispatch<React.SetStateAction<number>>;
  setCurrentSessionIndex: React.Dispatch<React.SetStateAction<number>>;
  resetTimerState: () => void;
}

export function useTimerCompletion({
  timerMode,
  settings,
  completedSessions,
  currentSessionIndex,
  setCompletedSessions,
  setTimerMode,
  setIsRunning,
  setTotalTimeToday,
  setCurrentSessionIndex,
  resetTimerState
}: UseTimerCompletionProps) {
  const { user } = useAuth();
  const isTransitioningRef = useRef<boolean>(false);
  
  // Use session tracking
  const { sessionStartTimeRef, setSessionStartTime } = useTimerSessionTracking();
  
  // Initialize session persistence
  const { saveSession } = useTimerSessionPersistence({ user });
  
  // Initialize timer cycle management
  const {
    handleWorkCompletion,
    handleBreakCompletion,
    handleLongBreakCompletion
  } = useTimerCycleManager({
    timerMode,
    settings,
    completedSessions,
    currentSessionIndex,
    setCompletedSessions,
    setTimerMode,
    setIsRunning,
    setTotalTimeToday,
    setCurrentSessionIndex,
    resetTimerState,
    saveSession
  });
  
  // Initialize timer completion handling
  const { handleCompletion } = useTimerCompletionHandling({
    timerMode,
    settings,
    isTransitioning: isTransitioningRef,
    handleWorkCompletion,
    handleBreakCompletion,
    handleLongBreakCompletion,
    setIsRunning,
    resetTimerState
  });
  
  // Create our main handler that will be exposed
  const handleTimerComplete = async () => {
    // Get the session start time (or use current time as fallback)
    const sessionStartTime = sessionStartTimeRef.current || new Date().toISOString();
    
    // Handle completion for this timer mode
    await handleCompletion(user?.id, sessionStartTime);
    
    // Reset the session start time for the next session
    sessionStartTimeRef.current = new Date().toISOString();
  };

  return { handleTimerComplete, sessionStartTimeRef };
}
