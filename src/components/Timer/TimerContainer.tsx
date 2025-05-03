
import React, { useEffect, useRef } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimer } from '@/hooks/useTimer';

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
  
  // Add debug logging to help track timer state
  useEffect(() => {
    console.log('Timer state updated:', { 
      mode: timerMode, 
      running: isRunning, 
      timeRemaining,
      progress,
      currentSessionIndex,
      totalSessions: settings?.sessionsUntilLongBreak || 4,
      settings
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

  // Handle settings updates (removed toast notification)
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

  return (
    <div 
      ref={containerRef}
      className="h-[450px] bg-black text-white rounded-lg p-4 flex flex-col items-center"
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
          <div className="text-xs rounded-full bg-black px-3 py-0.5 inline-block">
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
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
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
