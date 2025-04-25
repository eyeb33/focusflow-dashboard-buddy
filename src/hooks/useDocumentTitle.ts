
import { useEffect } from 'react';

interface UseDocumentTitleProps {
  timeRemaining: number;
  timerMode: 'work' | 'break' | 'longBreak';
  isRunning: boolean;
  formatTime: (seconds: number) => string;
}

export const useDocumentTitle = ({ 
  timeRemaining, 
  timerMode, 
  isRunning,
  formatTime 
}: UseDocumentTitleProps) => {
  useEffect(() => {
    const getCircleColor = () => {
      switch (timerMode) {
        case 'work':
          return '🔴';
        case 'break':
          return '🟢';
        case 'longBreak':
          return '🔵';
        default:
          return '⚪';
      }
    };

    const baseTitle = 'FocusFlow';
    const circle = getCircleColor();
    
    // When timer is running, show just the circle and time
    // When not running, show the app name
    document.title = isRunning 
      ? `${circle} ${formatTime(timeRemaining)}`
      : baseTitle;

    // Cleanup - restore original title when component unmounts
    return () => {
      document.title = 'FocusFlow';
    };
  }, [timeRemaining, timerMode, isRunning, formatTime]);
};

