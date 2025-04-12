
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { saveFocusSession } from '@/utils/timerStorage';
import { updateDailyStats } from '@/utils/productivityStats';
import { getTotalTime, savePartialSession, TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';

export function useTimerLogic(settings: TimerSettings) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRecordedTimeRef = useRef<number | null>(null);
  const lastRecordedFullMinutesRef = useRef<number>(0);

  // Reset timer when mode or settings change
  useEffect(() => {
    setTimeRemaining(getTotalTime(timerMode, settings));
    lastRecordedTimeRef.current = getTotalTime(timerMode, settings);
    lastRecordedFullMinutesRef.current = 0;
  }, [timerMode, settings]);

  // Timer tick logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            
            if (timerMode === 'work') {
              const newCompletedSessions = completedSessions + 1;
              setCompletedSessions(newCompletedSessions);
              setTotalTimeToday(prev => prev + settings.workDuration);
              
              if (user) {
                saveFocusSession(user.id, timerMode, settings.workDuration * 60);
                updateDailyStats(user.id, settings.workDuration);
              }
              
              if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
                setTimerMode('longBreak');
              } else {
                setTimerMode('break');
              }
            } else {
              if (user) {
                const duration = timerMode === 'break' ? settings.breakDuration * 60 : settings.longBreakDuration * 60;
                const durationMinutes = timerMode === 'break' ? settings.breakDuration : settings.longBreakDuration;
                saveFocusSession(user.id, timerMode, duration);
                updateDailyStats(user.id, durationMinutes);
              }
              
              setTimerMode('work');
            }
            
            lastRecordedTimeRef.current = null;
            lastRecordedFullMinutesRef.current = 0;
            setIsRunning(false);
            
            // Show toast for completed work session
            if (timerMode === 'work') {
              toast({
                title: "Session completed!",
                description: `You completed a ${settings.workDuration} minute focus session.`,
              });
            }
            
            return 0;
          }
          
          const newTime = prevTime - 1;
          const totalTime = getTotalTime(timerMode, settings);
          const elapsedSeconds = totalTime - newTime;
          const newFullMinutes = Math.floor(elapsedSeconds / 60);
          const prevFullMinutes = Math.floor((totalTime - prevTime) / 60);
          
          if (user && newFullMinutes > prevFullMinutes) {
            console.log(`Completed a new minute: ${newFullMinutes} minutes`);
            
            if (timerMode === 'work') {
              savePartialSession(
                user.id, 
                timerMode, 
                totalTime, 
                newTime, 
                lastRecordedFullMinutesRef.current
              ).then(({ newFullMinutes }) => {
                lastRecordedFullMinutesRef.current = newFullMinutes;
                setTotalTimeToday(prev => prev + 1);
              });
            }
          }
          
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerMode, user, settings, completedSessions, toast]);

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
  };

  return {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    setCompletedSessions,
    setTotalTimeToday,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
