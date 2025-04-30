
import React, { useEffect } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimerState } from '@/hooks/useTimerState';
import { toast } from 'sonner';

const TimerContainer = () => {
  const defaultSettings = {
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  };

  const {
    settings,
    setSettings,
    mode,
    setMode,
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    completedSessions,
    timerInterval,
    setTimerInterval,
    handleTimerComplete
  } = useTimerState(defaultSettings);

  // Setup timer interval effect
  useEffect(() => {
    if (isRunning) {
      // Clear any existing interval first to prevent multiple timers
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      
      console.log("Starting timer with mode:", mode, "and time:", timeRemaining);
      
      // Set up a new interval
      const interval = setInterval(() => {
        setTimeRemaining((prevTime) => {
          if (prevTime <= 1) {
            // Timer has completed
            clearInterval(interval);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      // Store the interval ID
      setTimerInterval(interval as unknown as number);
      
      // Clean up on unmount or when timer stops
      return () => clearInterval(interval);
    } else if (timerInterval) {
      // Clear interval when timer is paused
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [isRunning, setTimeRemaining, setTimerInterval, timerInterval, handleTimerComplete]);

  // Start the timer
  const startTimer = () => {
    console.log("Starting timer...");
    setIsRunning(true);
  };

  // Pause the timer
  const pauseTimer = () => {
    console.log("Pausing timer...");
    setIsRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  // Reset the timer
  const resetTimer = () => {
    pauseTimer();
    if (mode === 'focus') {
      setTimeRemaining(settings.focus * 60);
    } else if (mode === 'break') {
      setTimeRemaining(settings.break * 60);
    } else {
      setTimeRemaining(settings.longBreak * 60);
    }
  };

  // Change timer mode
  const changeMode = (newMode: 'focus' | 'break' | 'longBreak') => {
    setMode(newMode);
    pauseTimer();
    if (newMode === 'focus') {
      setTimeRemaining(settings.focus * 60);
    } else if (newMode === 'break') {
      setTimeRemaining(settings.break * 60);
    } else {
      setTimeRemaining(settings.longBreak * 60);
    }
  };

  // Update timer settings
  const updateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    if (!isRunning) {
      if (mode === 'focus') {
        setTimeRemaining(newSettings.focus * 60);
      } else if (mode === 'break') {
        setTimeRemaining(newSettings.break * 60);
      } else {
        setTimeRemaining(newSettings.longBreak * 60);
      }
    }
  };

  // Calculate current session index based on completed sessions
  const currentSessionIndex = completedSessions % settings.sessionsUntilLongBreak;

  return (
    <div className="h-[450px] bg-black text-white rounded-lg p-4 flex flex-col items-center">
      <TimerModeTabs currentMode={mode} onModeChange={changeMode} />

      <div className="relative flex flex-col items-center justify-center mt-2">
        <div className="text-center mb-2">
          <div className="text-xs rounded-full bg-black px-3 py-0.5 inline-block">
            {mode === 'focus' ? 'Focus' : mode === 'break' ? 'Break' : 'Long Break'}
          </div>
        </div>
        
        <TimerCircle
          secondsLeft={timeRemaining}
          totalSeconds={mode === 'focus' 
            ? settings.focus * 60 
            : mode === 'break' 
              ? settings.break * 60 
              : settings.longBreak * 60
          }
          mode={mode}
        />
      </div>

      <TimerControls 
        isRunning={isRunning}
        onStart={startTimer}
        onPause={pauseTimer}
        onReset={resetTimer}
      />
      
      <SessionDots 
        totalSessions={settings.sessionsUntilLongBreak}
        currentSessionIndex={currentSessionIndex}
      />

      {/* Settings button in the top right */}
      <div className="absolute top-4 right-4">
        <TimerSettings durations={settings} onChange={updateSettings} />
      </div>
    </div>
  );
};

export default TimerContainer;
