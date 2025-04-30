
// TimerContainer.tsx
import React, { useState } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';

const TimerContainer = () => {
  const [settings, setSettings] = useState({
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4
  });

  const [mode, setMode] = useState<'focus' | 'break' | 'longBreak'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(settings.focus * 60);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingTime(settings[mode] * 60);
  };

  const updateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    if (!isRunning) {
      setRemainingTime(newSettings[mode] * 60);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        <button onClick={() => setMode('focus')} className={mode === 'focus' ? 'btn-active' : ''}>Focus</button>
        <button onClick={() => setMode('break')} className={mode === 'break' ? 'btn-active' : ''}>Break</button>
        <button onClick={() => setMode('longBreak')} className={mode === 'longBreak' ? 'btn-active' : ''}>Long Break</button>
      </div>

      <TimerCircle
        secondsLeft={remainingTime}
        totalSeconds={settings[mode] * 60}
      />

      <div className="flex justify-center space-x-4">
        <button onClick={isRunning ? pauseTimer : startTimer}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetTimer}>Reset</button>
      </div>

      <TimerSettings durations={settings} onChange={updateSettings} />
    </div>
  );
};

export default TimerContainer;
