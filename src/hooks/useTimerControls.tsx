
import { useTimerContext } from '@/contexts/TimerContext';
import { TimerMode } from '@/utils/timerContextUtils';

export const useTimerControls = () => {
  const timer = useTimerContext();
  
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
  
  // Create more reliable wrapper functions to ensure proper behavior
  const start = () => {
    console.log("START called from useTimerControls - Current time:", timeRemaining);
    // The handleStart function expects a timerMode parameter in useTimerControlsLogic,
    // but TimerContext wraps it to not need a parameter. Let's use the current timerMode.
    handleStart();
  };
  
  const pause = () => {
    console.log("PAUSE called from useTimerControls - Current time:", timeRemaining);
    handlePause();
  };
  
  const reset = () => {
    console.log("RESET called from useTimerControls - Current time:", timeRemaining);
    handleReset();
  };
  
  const changeMode = (mode: TimerMode) => {
    console.log("CHANGE MODE called from useTimerControls - New mode:", mode);
    handleModeChange(mode);
  };
  
  return {
    isRunning,
    timerMode,
    timeRemaining,
    progress,
    currentSessionIndex,
    formatTime,
    start,
    pause,
    reset,
    changeMode,
    getModeLabel
  };
};
