
import React, { useEffect, useRef } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimer } from '@/hooks/useTimer';
import { toast } from 'sonner';

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
      totalSessions: settings.sessionsUntilLongBreak
    });
  }, [timerMode, isRunning, timeRemaining, progress, currentSessionIndex, settings.sessionsUntilLongBreak]);

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
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />
      
      <SessionDots 
        totalSessions={settings.sessionsUntilLongBreak} 
        currentSessionIndex={currentSessionIndex}
        mode={timerMode}
      />
      
      {/* Position the settings button in the upper right corner */}
      <div className="absolute top-4 right-4">
        <TimerSettings 
          durations={{
            focus: settings.workDuration,
            break: settings.breakDuration,
            longBreak: settings.longBreakDuration,
            sessionsUntilLongBreak: settings.sessionsUntilLongBreak
          }}
          onChange={(newDurations) => {
            // Update timer settings when sliders are changed
            updateSettings({
              workDuration: newDurations.focus,
              breakDuration: newDurations.break,
              longBreakDuration: newDurations.longBreak,
              sessionsUntilLongBreak: newDurations.sessionsUntilLongBreak
            });
            
            // Show a toast notification
            toast.success('Timer settings updated');
          }}
        />
      </div>
    </div>
  );
};

export default TimerContainer;
