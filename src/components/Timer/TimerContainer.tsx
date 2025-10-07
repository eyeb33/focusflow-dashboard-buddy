
import React, { useEffect } from 'react';
import TimerHeader from './TimerHeader';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import TimerObserver from './TimerObserver';
import { useTimerContext } from '@/contexts/TimerContext';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";

const TimerContainer = () => {
  const {
    timerMode,
    isRunning,
    timeRemaining,
    settings,
    completedSessions,
    currentSessionIndex,
    progress,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    updateSettings
  } = useTimerContext();
  
  const { theme } = useTheme();
  
  // Calculate total seconds for the current mode
  const getTotalSeconds = () => {
    if (!settings) return 0;
    
    switch(timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  };
  
  // Handle settings updates
  const handleSettingsChange = (newDurations: any) => {
    updateSettings(newDurations);
  };

  return (
    <TimerObserver>
      <div 
        className={cn(
          "min-h-[450px] rounded-2xl p-4 pb-6 flex flex-col items-center relative timer-container overflow-hidden",
          "shadow-2xl"
        )}
        data-testid="timer-container"
      >
        <TimerHeader 
          timerMode={timerMode}
          handleModeChange={handleModeChange}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onReset={handleReset}
        />

        <TimerDisplay 
          timerMode={timerMode}
          timeRemaining={timeRemaining}
          totalSeconds={getTotalSeconds()}
          theme={theme}
        />

        <TimerControls 
          isRunning={isRunning}
          mode={timerMode}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
        />
        <SessionDots 
          totalSessions={settings?.sessionsUntilLongBreak || 4} 
          currentSessionIndex={currentSessionIndex}
          mode={timerMode}
        />
      </div>
    </TimerObserver>
  );
};

export default TimerContainer;
