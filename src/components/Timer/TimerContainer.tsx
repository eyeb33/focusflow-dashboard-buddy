
import React, { useEffect, useRef } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimerContext } from '@/contexts/TimerContext'; // Use the context instead of the hook directly
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
    formatTime,
    updateSettings
  } = useTimerContext();
  
  // Get current theme
  const { theme } = useTheme();

  // Store the container element to check if timer is visible
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  // Map timerMode to the format expected by TimerCircle
  const getTimerCircleMode = () => {
    switch(timerMode) {
      case 'work': return 'focus';
      case 'break': return 'break';
      case 'longBreak': return 'longBreak';
      default: return 'focus';
    }
  };
  
  // Debug logging for timer state changes
  useEffect(() => {
    const totalSeconds = getTotalSeconds();
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    console.log('TimerContainer state update:', { 
      mode: timerMode, 
      running: isRunning, 
      timeRemaining,
      formattedTime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      progress,
      currentSessionIndex,
      totalSessions: settings?.sessionsUntilLongBreak || 4
    });
  }, [timerMode, isRunning, timeRemaining, progress, currentSessionIndex, settings]);

  // Use IntersectionObserver to detect if timer is visible in the DOM
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const isVisible = entry.isIntersecting;
          sessionStorage.setItem('timerVisible', isVisible ? 'true' : 'false');
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Handle settings updates from the TimerSettings component
  const handleSettingsChange = (newDurations: any) => {
    // Convert UI component settings format to timer context format
    const updatedSettings = {
      workDuration: newDurations.focus,
      breakDuration: newDurations.break,
      longBreakDuration: newDurations.longBreak,
      sessionsUntilLongBreak: newDurations.sessionsUntilLongBreak
    };
    
    console.log("Received new settings:", updatedSettings);
    updateSettings(updatedSettings);
  };

  // Log whenever timer controls are used with enhanced debugging
  const handleTimerStart = () => {
    console.log("START button pressed in TimerContainer - current time:", timeRemaining);
    handleStart();
    console.log("After START call - time is:", timeRemaining, "isRunning:", isRunning);
  };

  const handleTimerPause = () => {
    console.log("PAUSE button pressed in TimerContainer - current time:", timeRemaining);
    
    // Store time before pause
    const timeBeforePause = timeRemaining;
    
    // Call the pause function from the context
    handlePause();
    
    // Log after action
    console.log("After PAUSE call - time before:", timeBeforePause, "time now:", timeRemaining);
  };

  const handleTimerReset = () => {
    console.log("RESET button pressed in TimerContainer");
    handleReset();
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "h-[450px] rounded-lg p-4 flex flex-col items-center relative",
        theme === "dark" 
          ? "bg-black text-white" 
          : "bg-white text-gray-900 border border-gray-200"
      )}
      data-testid="timer-container"
    >
      <div className="flex items-center justify-between w-full mb-2">
        <TimerModeTabs 
          currentMode={timerMode === 'work' ? 'focus' : timerMode} 
          onModeChange={(newMode) => {
            // Convert focus back to work for compatibility
            const mappedMode = newMode === 'focus' ? 'work' : newMode;
            handleModeChange(mappedMode);
          }} 
        />
        
        {/* Moved settings button into this header area */}
        <TimerSettings 
          durations={{
            focus: settings?.workDuration || 25,
            break: settings?.breakDuration || 5,
            longBreak: settings?.longBreakDuration || 15,
            sessionsUntilLongBreak: settings?.sessionsUntilLongBreak || 4
          }}
          onChange={handleSettingsChange}
        />
      </div>

      <div className="relative flex flex-col items-center justify-center mt-2">
        <div className="text-center mb-2">
          <div className={cn(
            "text-xs rounded-full px-3 py-0.5 inline-block",
            theme === "dark" 
              ? "bg-gray-800 text-gray-200" 
              : "bg-gray-100 text-gray-700" 
          )}>
            {timerMode === 'work' ? 'Focus' : timerMode === 'break' ? 'Short Break' : 'Long Break'}
          </div>
        </div>
        
        <TimerCircle
          secondsLeft={timeRemaining}
          totalSeconds={getTotalSeconds()}
          mode={getTimerCircleMode()}
        />
      </div>

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
  );
};

export default TimerContainer;
