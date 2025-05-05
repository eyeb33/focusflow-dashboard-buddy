
import React, { useEffect, useRef } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimer } from '@/hooks/useTimer';
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
  } = useTimer();
  
  // Get current theme
  const { theme } = useTheme();

  // Store the container element to check if timer is visible
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ref to prevent timer resets on pause
  const lastTimeRef = useRef<number>(timeRemaining);

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
  
  // Update lastTimeRef whenever timeRemaining changes
  useEffect(() => {
    lastTimeRef.current = timeRemaining;
  }, [timeRemaining]);
  
  // Add debug logging to help track timer state
  useEffect(() => {
    const totalSeconds = getTotalSeconds();
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    console.log('Timer state updated:', { 
      mode: timerMode, 
      running: isRunning, 
      timeRemaining,
      formattedTime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      progress,
      currentSessionIndex,
      totalSessions: settings?.sessionsUntilLongBreak || 4,
      settings: settings ? {
        workDuration: settings.workDuration,
        breakDuration: settings.breakDuration,
        longBreakDuration: settings.longBreakDuration
      } : null,
      totalSeconds
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

  // Handle settings updates
  const handleSettingsChange = (newDurations: any) => {
    // Map the settings format from the UI component to the timer context format
    const updatedSettings = {
      workDuration: newDurations.focus,
      breakDuration: newDurations.break,
      longBreakDuration: newDurations.longBreak,
      sessionsUntilLongBreak: newDurations.sessionsUntilLongBreak
    };
    
    console.log("Updating timer settings:", updatedSettings);
    
    // Update the timer settings
    updateSettings(updatedSettings);
  };

  // Log whenever timer controls are used
  const handleTimerStart = () => {
    console.log("Timer start button pressed - current time:", timeRemaining);
    handleStart();
  };

  const handleTimerPause = () => {
    console.log("Timer pause button pressed - current time:", timeRemaining, "stored in ref:", lastTimeRef.current);
    // Store the time before pausing to ensure we can reference it if needed
    const timeBeforePause = timeRemaining;
    handlePause();
    console.log("After pause handler called - time is now:", timeRemaining, "time before pause was:", timeBeforePause);
  };

  const handleTimerReset = () => {
    console.log("Timer reset button pressed");
    handleReset();
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "h-[450px] rounded-lg p-4 flex flex-col items-center",
        theme === "dark" 
          ? "bg-black text-white" 
          : "bg-white text-gray-900 border border-gray-200" // Proper light mode styling
      )}
      data-testid="timer-container"
    >
      <TimerModeTabs 
        currentMode={timerMode === 'work' ? 'focus' : timerMode} 
        onModeChange={(newMode) => {
          // Convert focus back to work for compatibility
          const mappedMode = newMode === 'focus' ? 'work' : newMode;
          handleModeChange(mappedMode);
        }} 
      />

      <div className="relative flex flex-col items-center justify-center mt-2">
        <div className="text-center mb-2">
          <div className={cn(
            "text-xs rounded-full px-3 py-0.5 inline-block",
            theme === "dark" 
              ? "bg-gray-800 text-gray-200" 
              : "bg-gray-100 text-gray-700" // Better light mode contrast
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
      
      {/* Position the settings button in the upper right corner */}
      <div className="absolute top-4 right-4">
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
    </div>
  );
};

export default TimerContainer;
