
import { useTimer } from '@/contexts/TimerContext';
import { TimerMode } from '@/utils/timerContextUtils';

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
    changeMode: (mode: TimerMode) => handleModeChange(mode),
    getModeLabel
  };
};
