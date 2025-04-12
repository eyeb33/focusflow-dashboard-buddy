
import { useTimer } from '@/contexts/TimerContext';

export const useTimerControls = () => {
  const timer = useTimer();
  
  const {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    isRunning,
    timerMode,
    getModeLabel,
    formatTime,
    timeRemaining,
    progress
  } = timer;
  
  return {
    isRunning,
    timerMode,
    timeRemaining,
    progress,
    formatTime,
    start: handleStart,
    pause: handlePause,
    reset: handleReset,
    changeMode: handleModeChange,
    getModeLabel
  };
};

