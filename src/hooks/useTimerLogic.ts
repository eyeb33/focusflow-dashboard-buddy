
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveFocusSession } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';
import { getTotalTime, savePartialSession, TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';
import { useTimerInterval } from './useTimerInterval';
import { playTimerCompletionSound, initAudioContext } from '@/utils/audioUtils';

export function useTimerLogic(settings: TimerSettings) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  
  const lastRecordedTimeRef = useRef<number | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudioOnInteraction = () => {
      initAudioContext();
      // Remove event listeners after initialization
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };

    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);

    return () => {
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };
  }, []);

  // Reset timer when mode or settings change
  useEffect(() => {
    setTimeRemaining(getTotalTime(timerMode, settings));
    lastRecordedTimeRef.current = getTotalTime(timerMode, settings);
    lastRecordedFullMinutesRef.current = 0;
  }, [timerMode, settings]);

  // Handle timer completion
  const handleTimerComplete = () => {
    // Play sound when timer completes
    playTimerCompletionSound();

    if (timerMode === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalTimeToday(prev => prev + settings.workDuration);
      
      if (user) {
        saveFocusSession(user.id, timerMode, settings.workDuration * 60);
        updateDailyStats(user.id, settings.workDuration);
      }
      
      // After work session is completed, check if long break is needed
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setTimerMode('longBreak');
        // Update the current session index to match the completed session
        setCurrentSessionIndex(newCompletedSessions % settings.sessionsUntilLongBreak);
        toast({
          title: "Time for a long break!",
          description: `You've completed ${settings.sessionsUntilLongBreak} focus sessions. Take a longer break now.`,
        });
        // Automatically start the long break timer
        setTimeout(() => {
          setIsRunning(true);
        }, 50);
      } else {
        setTimerMode('break');
        // Update the current session index to match the completed session
        setCurrentSessionIndex(newCompletedSessions % settings.sessionsUntilLongBreak);
        toast({
          title: "Session completed!",
          description: `You completed a ${settings.workDuration} minute focus session.`,
        });
        // Automatically start the break timer
        setTimeout(() => {
          setIsRunning(true);
        }, 50);
      }
    } else {
      if (user) {
        const duration = timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
        const durationMinutes = timerMode === 'break' ? settings.breakDuration : settings.longBreakDuration;
        saveFocusSession(user.id, timerMode, duration);
        updateDailyStats(user.id, durationMinutes);
      }
      
      // After breaks, go back to work mode
      setTimerMode('work');
      
      // After a break, we should advance to the next focus session
      // ONLY if we just completed a break (not a long break)
      if (timerMode === 'break') {
        toast({
          title: "Break finished!",
          description: "Time to focus again.",
        });
        // Automatically start the next focus timer
        setTimeout(() => {
          setIsRunning(true);
        }, 50);
      } else if (timerMode === 'longBreak') {
        toast({
          title: "Long break finished!",
          description: "Ready to start a new cycle?",
        });
        // After a long break, reset the current session index to start a new cycle
        setCurrentSessionIndex(0);
        // Do NOT automatically start after a long break - it's the end of a complete cycle
      }
    }
    
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    setIsRunning(false);
  };

  // Get the current total time based on timer mode
  const getCurrentTotalTime = () => getTotalTime(timerMode, settings);

  // Use the timer interval hook
  useTimerInterval({
    isRunning,
    timerMode,
    timeRemaining,
    setTimeRemaining,
    getTotalTime: getCurrentTotalTime,
    onTimerComplete: handleTimerComplete,
    lastRecordedFullMinutesRef
  });

  // Timer control functions
  const handleStart = () => {
    lastRecordedTimeRef.current = timeRemaining;
    const totalTime = getTotalTime(timerMode, settings);
    const elapsedSeconds = totalTime - timeRemaining;
    lastRecordedFullMinutesRef.current = Math.floor(elapsedSeconds / 60);
    setIsRunning(true);
  };
  
  const handlePause = async () => {
    setIsRunning(false);
    if (user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
  };
  
  const handleReset = async () => {
    setIsRunning(false);
    if (user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    setTimeRemaining(getTotalTime(timerMode, settings));
    lastRecordedTimeRef.current = getTotalTime(timerMode, settings);
    lastRecordedFullMinutesRef.current = 0;
    
    // Reset the current session index when timer is reset
    if (timerMode === 'work') {
      setCurrentSessionIndex(0);
    }
  };

  const handleModeChange = async (mode: TimerMode) => {
    if (isRunning && user && lastRecordedTimeRef.current) {
      const totalTime = getTotalTime(timerMode, settings);
      await savePartialSession(
        user.id, 
        timerMode, 
        totalTime, 
        timeRemaining, 
        lastRecordedFullMinutesRef.current
      );
    }
    
    setIsRunning(false);
    setTimerMode(mode);
    lastRecordedTimeRef.current = null;
    lastRecordedFullMinutesRef.current = 0;
    
    // Reset the current session index when manually changing modes
    if (mode === 'work') {
      setCurrentSessionIndex(0);
    }
  };

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    setCompletedSessions,
    setTotalTimeToday,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
