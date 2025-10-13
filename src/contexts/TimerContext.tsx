
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useTimerSettings } from '@/hooks/useTimerSettings';
import { useTimerLogic } from '@/hooks/useTimerLogic';
import { formatTime as formatTimeUtil, getModeLabel as getModeLabelUtil } from '@/utils/timerUtils';

interface TimerContextType {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  completedSessions: number;
  totalTimeToday: number;
  currentSessionIndex: number;
  settings: ReturnType<typeof useTimerSettings>['settings'];
  progress: number;
  activeTaskId: string | null;
  formatTime: (seconds: number) => string;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: () => void;
  handleModeChange: (mode: TimerMode) => void;
  getModeLabel: (mode?: TimerMode) => string;
  updateSettings: (newSettings: Partial<ReturnType<typeof useTimerSettings>['settings']>) => void;
  setActiveTaskId: (taskId: string | null) => void;
  getElapsedMinutes: () => number;
  getElapsedSeconds: () => number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useTimerSettings();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const prevCompletedSessions = useRef(0);
  const workTimeRef = useRef(0);
  
  // Use our simplified timer logic
  const {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    progress,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  } = useTimerLogic({ settings, activeTaskId });

  // Proactive coaching triggers - to be used by CoachContext
  useEffect(() => {
    // Track work time for extended work detection
    if (isRunning && timerMode === 'work') {
      const interval = setInterval(() => {
        workTimeRef.current += 1;
        
        // Trigger after 2 hours of continuous work (7200 seconds)
        if (workTimeRef.current === 7200 || workTimeRef.current % 3600 === 0 && workTimeRef.current > 7200) {
          // This will be picked up by CoachContext
          window.dispatchEvent(new CustomEvent('coach:extended-work', {
            detail: { minutes: workTimeRef.current / 60 }
          }));
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (!isRunning) {
      workTimeRef.current = 0;
    }
  }, [isRunning, timerMode]);

  // Trigger on Pomodoro cycle completion (4 sessions)
  useEffect(() => {
    if (completedSessions > 0 && 
        completedSessions !== prevCompletedSessions.current && 
        completedSessions % 4 === 0) {
      window.dispatchEvent(new CustomEvent('coach:pomodoro-cycle', {
        detail: { cycles: completedSessions / 4 }
      }));
    }
    prevCompletedSessions.current = completedSessions;
  }, [completedSessions]);

  // Format time helper
  const formatTime = (seconds: number) => formatTimeUtil(seconds);
  
  // Get mode label helper
  const getModeLabel = (mode?: TimerMode) => getModeLabelUtil(mode || timerMode);

// Get elapsed minutes for work sessions
const getElapsedMinutes = (): number => {
  if (timerMode !== 'work') return 0;
  const totalTime = settings.workDuration * 60;
  const elapsed = totalTime - timeRemaining;
  return Math.floor(elapsed / 60);
};

// Get elapsed seconds for work sessions
const getElapsedSeconds = (): number => {
  if (timerMode !== 'work') return 0;
  const totalTime = settings.workDuration * 60;
  const elapsed = totalTime - timeRemaining;
  return Math.max(0, Math.floor(elapsed));
};

  // Handle settings updates
  const handleUpdateSettings = (newSettings: Partial<typeof settings>) => {
    updateSettings(newSettings);
  };
  
  const value: TimerContextType = {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    settings,
    progress,
    activeTaskId,
    formatTime,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    getModeLabel,
    updateSettings: handleUpdateSettings,
    setActiveTaskId,
    getElapsedMinutes,
    getElapsedSeconds,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimerContext = () => {
  const context = useContext(TimerContext);
  
  if (context === undefined) {
    throw new Error('useTimerContext must be used within a TimerProvider');
  }
  
  return context;
};
