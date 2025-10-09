
import React, { createContext, useContext, useState } from 'react';
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
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useTimerSettings();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
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

  // Format time helper
  const formatTime = (seconds: number) => formatTimeUtil(seconds);
  
  // Get mode label helper
  const getModeLabel = (mode?: TimerMode) => getModeLabelUtil(mode || timerMode);

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
    setActiveTaskId
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
