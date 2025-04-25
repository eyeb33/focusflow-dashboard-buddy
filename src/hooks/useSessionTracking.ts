
import { useRef } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

export function useSessionTracking() {
  const sessionStartTimeRef = useRef<string | null>(null);
  const skipTimerResetRef = useRef<boolean>(false);
  const previousSettingsRef = useRef<any>(null);
  const modeChangeInProgressRef = useRef<boolean>(false);
  
  return {
    sessionStartTimeRef,
    skipTimerResetRef,
    previousSettingsRef,
    modeChangeInProgressRef
  };
}
