
import { useRef, useEffect } from 'react';
import { TimerSettings } from '../useTimerSettings';
import { enableRealtimeForSessionsSummary } from '@/utils/timerContextUtils';

export function useSessionTracking(settings: TimerSettings) {
  // Initialize session tracking refs
  const sessionStartTimeRef = useRef<string | null>(null);
  const skipTimerResetRef = useRef<boolean>(false);
  const previousSettingsRef = useRef<TimerSettings | null>(null);
  const modeChangeInProgressRef = useRef<boolean>(false);

  // Enable realtime updates
  useEffect(() => {
    enableRealtimeForSessionsSummary();
  }, []);

  return {
    sessionStartTimeRef,
    skipTimerResetRef,
    previousSettingsRef,
    modeChangeInProgressRef
  };
}
