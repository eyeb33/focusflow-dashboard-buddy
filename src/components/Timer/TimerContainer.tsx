
import React, { useEffect } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimer } from '@/hooks/useTimer';
import { useTimerSettings } from '@/hooks/useTimerSettings';

const TimerContainer = () => {
  // Get the timer settings
  const { settings, updateSettings } = useTimerSettings();

  // Pass the settings to useTimer
  const {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    currentSessionIndex,
    progress,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  } = useTimer(settings);

  // Map timerMode to the format expected by TimerCircle
  const getTimerCircleMode = () => {
    switch(timerMode) {
      case 'work': return 'focus';
      case 'break': return 'break';
      case 'longBreak': return 'longBreak';
      default: return 'focus';
    }
  };

  // Calculate total seconds for the current mode
  const getTotalSeconds = () => {
    switch(timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  };

  // Debug settings integration
  useEffect(() => {
    console.log("Timer settings updated:", settings);
    console.log("Current timer state:", { timerMode, timeRemaining, isRunning });
  }, [settings, timerMode, timeRemaining, isRunning]);

  return (
    <div className="h-[450px] bg-black text-white rounded-lg p-4 flex flex-col items-center">
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
            {timerMode === 'work' ? 'Focus' : timerMode === 'break' ? 'Break' : 'Long Break'}
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
          }}
        />
      </div>
    </div>
  );
};

export default TimerContainer;
