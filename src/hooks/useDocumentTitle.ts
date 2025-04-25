
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
    
    // When timer is running or has time remaining, show the circle and time
    // When idle, show the app name
    document.title = (isRunning || timeRemaining < getTotalTime())
      ? `${circle} ${formatTime(timeRemaining)}`
      : baseTitle;

    // Cleanup - restore original title when component unmounts
    return () => {
      document.title = 'FocusFlow';
    };
  }, [timeRemaining, timerMode, isRunning, formatTime]);
  
  // Helper function to get total time based on mode
  const getTotalTime = () => {
    switch (timerMode) {
      case 'work':
        return 25 * 60; // Default work time
      case 'break':
        return 5 * 60;  // Default break time
      case 'longBreak':
        return 15 * 60; // Default long break time
      default:
        return 0;
    }
  };
};
