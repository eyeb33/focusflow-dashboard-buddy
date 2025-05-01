
// Main useTimer hook that pulls all the timer logic together
import { useTimerCore } from './timer/useTimerCore';
import { TimerSettings } from './useTimerSettings';

// Main timer hook that combines all timer logic
export function useTimer(settings: TimerSettings) {
  return useTimerCore(settings);
}
