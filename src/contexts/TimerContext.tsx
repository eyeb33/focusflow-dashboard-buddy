
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
  // Use the settings hook first
  const { settings, updateSettings } = useTimerSettings();
  
  // Use the timer logic hook which contains all the core functionality
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
  
  // Enable realtime updates
  useEffect(() => {
    enableRealtimeForSessionsSummary();
  }, []);
  
  // Create a wrapper for handleStart that uses the current timerMode
  const handleStart = () => {
    console.log("handleStart wrapper called in TimerContext, current mode:", timerMode);
    // This calls the handleStart in useTimerLogic, which will pass timerMode to controlsHandleStart
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
