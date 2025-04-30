// TimerCircle.tsx
import React, { useEffect } from 'react';

const TimerCircle = ({
  mode,
  remainingTime,
  isRunning,
  isPaused,
  onPauseResume,
  onReset,
  startTimer,
  setRemainingTime
}: any) => {

  useEffect(() => {
    let interval: any;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setRemainingTime((prev: number) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-5xl font-bold">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="flex gap-4">
        <button onClick={startTimer}>Start</button>
        <button onClick={onPauseResume}>{isPaused ? 'Resume' : 'Pause'}</button>
        <button onClick={onReset}>Reset</button>
      </div>
    </div>
  );
};

export default TimerCircle;
