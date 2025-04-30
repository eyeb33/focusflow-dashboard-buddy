// TimerContainer.tsx
import React, { useState } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';

const TimerContainer = () => {
  const [settings, setSettings] = useState({
    focus: 25 * 60,
    break: 5 * 60,
    longBreak: 15 * 60,
    sessionsBeforeLongBreak: 4
  });

  const [mode, setMode] = useState<'focus' | 'break' | 'longBreak'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(settings.focus);

  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseOrResume = () => {
    setIsPaused(prev => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setRemainingTime(settings[mode]);
  };

  const updateSetting = (key: keyof typeof settings, value: number) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    if (key === mode) setRemainingTime(value); // update timer if editing current mode
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        <button onClick={() => setMode('focus')} className={mode === 'focus' ? 'btn-active' : ''}>Focus</button>
        <button onClick={() => setMode('break')} className={mode === 'break' ? 'btn-active' : ''}>Break</button>
        <button onClick={() => setMode('longBreak')} className={mode === 'longBreak' ? 'btn-active' : ''}>Long Break</button>
      </div>

      <TimerCircle
        mode={mode}
        remainingTime={remainingTime}
        isRunning={isRunning}
        isPaused={isPaused}
        onPauseResume={pauseOrResume}
        onReset={resetTimer}
        startTimer={startTimer}
        setRemainingTime={setRemainingTime}
      />

      <TimerSettings settings={settings} onChange={updateSetting} />
    </div>
  );
};

export default TimerContainer;
