
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
    progress,
    currentSessionIndex
  } = timer;
  
  // Enhanced console logging for debugging timer controls
  console.log("Timer controls state:", {
    isRunning,
    timerMode,
    timeRemaining, 
    progress,
    currentSessionIndex
  });
  
  return {
    isRunning,
    timerMode,
    timeRemaining,
    progress,
    currentSessionIndex,
    formatTime,
    start: handleStart,
    pause: handlePause,
    reset: handleReset,
    changeMode: (mode: TimerMode) => handleModeChange(mode),
    getModeLabel
  };
};
