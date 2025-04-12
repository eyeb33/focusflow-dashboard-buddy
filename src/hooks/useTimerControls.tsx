
import { useTimer } from '@/contexts/TimerContext';

export const useTimerControls = () => {
  const timer = useTimer();
  
  // Extract only the control methods
  const {
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
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
    skip: handleSkip,
    changeMode: handleModeChange,
    getModeLabel
  };
};
