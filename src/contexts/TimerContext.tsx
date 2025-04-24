
import React, { createContext, useContext, useEffect } from 'react';
import { TimerMode, enableRealtimeForSessionsSummary } from '@/utils/timerContextUtils';
import { formatTime, getModeLabel } from '@/utils/timerUtils';
import { useTimerLogic } from '@/hooks/useTimerLogic';
import { useTimerSettings } from '@/hooks/useTimerSettings';

interface TimerContextType {
  timerMode: TimerMode;
  isRunning: boolean;
  timeRemaining: number;
  completedSessions: number;
  totalTimeToday: number;
  currentSessionIndex: number;
  settings: ReturnType<typeof useTimerSettings>['settings'];
  progress: number;
  formatTime: (seconds: number) => string;
  handleStart: () => void;
  handlePause: () => void;
  handleReset: () => void;
  handleModeChange: (mode: TimerMode) => void;
  getModeLabel: () => string;
  updateSettings: (newSettings: Partial<ReturnType<typeof useTimerSettings>['settings']>) => void;
  setAutoStart: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4
};

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use the settings hook
  const { settings, updateSettings } = useTimerSettings();
  
  // Use the timer logic hook which contains all the core functionality
  const {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    setAutoStart
  } = useTimerLogic(settings);
  
  // Enable realtime updates for sessions_summary table
  useEffect(() => {
    enableRealtimeForSessionsSummary();
  }, []);
  
  // Calculate total time for current timer mode
  const getTotalTime = (): number => {
    switch (timerMode) {
      case 'break':
        return settings.breakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      case 'work':
      default:
        return settings.workDuration * 60;
    }
  };
  
  // Calculate progress as elapsed / total time
  // This ensures the progress starts at 0 and fills up to 1
  const totalTime = getTotalTime();
  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;
  
  const getTimerModeLabel = () => getModeLabel(timerMode);

  const value = {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    settings,
    progress,
    formatTime,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    getModeLabel: getTimerModeLabel,
    updateSettings,
    setAutoStart
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
    throw new Error('useTimer must be used within a TimerProvider');
  }
  
  return context;
};

export const useTimer = useTimerContext;
