
import React, { createContext, useContext, useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';
import { useTimerSettings } from '@/hooks/useTimerSettings';
import { useTimerCore } from '@/hooks/timer/useTimerCore';

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
  getModeLabel: (mode?: TimerMode) => string;
  updateSettings: (newSettings: Partial<ReturnType<typeof useTimerSettings>['settings']>) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useTimerSettings();
  
  // Create a ref to track if settings have been loaded
  const settingsLoadedRef = useRef(false);
  if (settings.workDuration > 0 && !settingsLoadedRef.current) {
    settingsLoadedRef.current = true;
    console.log('Settings loaded:', settings);
  }
  
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
    handleModeChange,
    getModeLabel,
    formatTime
  } = useTimerCore(settings);
  
  const value: TimerContextType = {
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
    getModeLabel,
    updateSettings
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

// Export the timer hook for component use
export const useTimer = useTimerContext;
