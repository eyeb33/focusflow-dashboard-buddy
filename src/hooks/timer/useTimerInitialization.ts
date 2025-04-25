
import { useState } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

export function useTimerInitialization() {
  const [timerMode, setTimerMode] = useState<TimerMode>('work');
  
  return {
    timerMode,
    setTimerMode
  };
}
