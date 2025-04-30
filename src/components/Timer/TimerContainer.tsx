
import React from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimerState } from '@/hooks/useTimerState';

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
    setTimerInterval
  } = useTimerState(defaultSettings);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

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
