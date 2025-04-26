
import { useState } from 'react';

export function useTimerState(initialTime: number) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [autoStart, setAutoStart] = useState<boolean>(false);
  
  return {
    isRunning,
    setIsRunning,
    timeRemaining,
    setTimeRemaining,
    autoStart,
    setAutoStart
  };
}
