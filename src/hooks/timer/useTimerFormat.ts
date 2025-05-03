
import { TimerMode } from '@/utils/timerContextUtils';

export function useTimerFormat() {
  // Format time from seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Get user-friendly label for timer mode
  const getModeLabel = (mode?: TimerMode): string => {
    const timerMode = mode || 'work';
    
    switch(timerMode) {
      case 'work':
        return 'Focus Session';
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Focus Session';
    }
  };

  return {
    formatTime,
    getModeLabel
  };
}
