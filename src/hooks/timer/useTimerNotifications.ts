
import { useToast } from '@/hooks/use-toast';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerSettings } from '@/hooks/useTimerSettings';

interface NotificationParams {
  timerMode: TimerMode;
  settings: TimerSettings;
  completedSessions: number;
}

export function useTimerNotifications() {
  const { toast } = useToast();
  
  const showCompletionNotification = ({ timerMode, settings }: NotificationParams) => {
    if (timerMode === 'work') {
      toast({
        title: "Session completed!",
        description: `You completed a ${settings.workDuration} minute focus session.`,
      });
    } else {
      toast({
        title: timerMode === 'break' ? "Break completed!" : "Long break completed!",
        description: "Starting your next focus session.",
      });
    }
  };
  
  return { showCompletionNotification };
}
