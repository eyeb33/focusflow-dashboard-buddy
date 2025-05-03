
import React, { createContext, useContext, useRef, useEffect } from 'react';
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
  
  // For debugging, clear any stale timer state on mount
  useEffect(() => {
    console.log("TimerProvider mounted - Ensuring fresh timer state");
    localStorage.removeItem('timerState');
  }, []);
  
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

  // This ensures that when settings change, we log it clearly
  useEffect(() => {
    console.log('Timer settings updated in context:', settings);
  }, [settings]);

  // Create the combined handler for updating settings
  const handleUpdateSettings = (newSettings: Partial<typeof settings>) => {
    console.log('Updating timer settings:', newSettings);
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
    formatTime,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    getModeLabel,
    updateSettings: handleUpdateSettings
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
