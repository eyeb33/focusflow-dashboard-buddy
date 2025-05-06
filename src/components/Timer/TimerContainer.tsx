
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
  // Get timer context
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
  
  // Get current theme
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
  
  // Debug logging for timer state changes
  useEffect(() => {
    const totalSeconds = getTotalSeconds();
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    console.log('[TimerContainer] State update:', { 
      mode: timerMode, 
      running: isRunning, 
      timeRemaining,
      formattedTime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      progress,
      currentSessionIndex,
      totalSessions: settings?.sessionsUntilLongBreak || 4
    });
  }, [timerMode, isRunning, timeRemaining, progress, currentSessionIndex, settings]);

  // Handle settings updates from the TimerSettings component
  const handleSettingsChange = (newDurations: any) => {
    console.log("[TimerContainer] Received new settings:", newDurations);
    
    // Directly update the timer settings in the context
    updateSettings(newDurations);
  };

  // Log whenever timer controls are used with enhanced debugging
  const handleTimerStart = () => {
    console.log("[TimerContainer] START button pressed - current time:", timeRemaining, "isRunning:", isRunning);
    handleStart();
    console.log("[TimerContainer] After START call - time is:", timeRemaining, "isRunning:", isRunning);
  };

  const handleTimerPause = () => {
    console.log("[TimerContainer] PAUSE button pressed - current time:", timeRemaining, "isRunning:", isRunning);
    handlePause();
    console.log("[TimerContainer] After PAUSE call - time is:", timeRemaining);
  };

  const handleTimerReset = () => {
    console.log("[TimerContainer] RESET button pressed");
    handleReset();
  };

  return (
    <TimerObserver>
      <div 
        className={cn(
          "h-[450px] rounded-lg p-4 flex flex-col items-center relative",
          theme === "dark" 
            ? "bg-black text-white" 
            : "bg-white text-gray-900 border border-gray-200"
        )}
        data-testid="timer-container"
      >
        <TimerHeader 
          timerMode={timerMode}
          handleModeChange={handleModeChange}
          settings={settings}
          onSettingsChange={handleSettingsChange}
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
          onStart={handleTimerStart}
          onPause={handleTimerPause}
          onReset={handleTimerReset}
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
