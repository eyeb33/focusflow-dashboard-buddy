
import { TimerMode } from '@/utils/timerContextUtils';
import { useTimerControlStart } from './useTimerControlStart';
import { useTimerControlPause } from './useTimerControlPause';
import { useTimerControlReset } from './useTimerControlReset';
import { useTimerControlModeChange } from './useTimerControlModeChange';

interface TimerSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
}

interface TimerControlsParams {
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  timeRemaining: number;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  sessionStartTimeRef: React.MutableRefObject<string | null>;
  pausedTimeRef: React.MutableRefObject<number | null>;
  currentSessionIndex: number;
  setCurrentSessionIndex: (index: number) => void;
  settings: TimerSettings;
  saveTimerState: (state: any) => void;
}

export function useTimerControls(params: TimerControlsParams) {
  const handleStart = useTimerControlStart(params);
  
  const handlePause = useTimerControlPause(params);
  
  const handleReset = useTimerControlReset(params);
  
  const handleModeChange = useTimerControlModeChange(params);
  
  return {
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  };
}
