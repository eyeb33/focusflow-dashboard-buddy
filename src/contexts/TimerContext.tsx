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

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useTimerSettings();
  
  const {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    currentSessionIndex,
    progress,
    handleStart: originalHandleStart,
    handlePause,
    handleReset,
    handleModeChange,
    setAutoStart
  } = useTimerLogic(settings);
  
  useEffect(() => {
    enableRealtimeForSessionsSummary();
  }, []);
  
  const handleStart = () => {
    console.log("handleStart wrapper called in TimerContext, current mode:", timerMode);
    originalHandleStart();
  };
  
  const getTimerModeLabel = () => getModeLabel(timerMode);

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
