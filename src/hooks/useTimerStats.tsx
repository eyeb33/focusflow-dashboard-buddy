import { useTimerControls } from "./useTimerControls";
import { useTimerSettings } from "./useTimerSettings";

export function useTimerStats() {
  const { completedSessions } = useTimerControls();
  const { settings } = useTimerSettings();

  const sessionsUntilLongBreak = settings.sessionsBeforeLongBreak;

  return {
    completedSessions,
    sessionsUntilLongBreak,
  };
}
