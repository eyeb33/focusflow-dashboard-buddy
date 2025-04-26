
import { useEffect } from 'react';

interface UseDocumentTitleProps {
  timeRemaining: number;
  timerMode: 'work' | 'break' | 'longBreak';
  isRunning: boolean;
  formatTime: (seconds: number) => string;
  settings?: {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  };
}

export const useDocumentTitle = ({ 
  timeRemaining, 
  timerMode, 
  isRunning,
  formatTime,
  settings
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
    
    // Helper function to get total time based on mode
    const getTotalTime = () => {
      if (settings) {
        switch (timerMode) {
          case 'work':
            return settings.workDuration * 60;
          case 'break':
            return settings.breakDuration * 60;
          case 'longBreak':
            return settings.longBreakDuration * 60;
          default:
            return 0;
        }
      } else {
        // Fallback to default values if settings aren't provided
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
      }
    };
    
    // When timer is running or has time remaining, show the circle and time
    // When idle, show the app name
    document.title = (isRunning || timeRemaining < getTotalTime())
      ? `${circle} ${formatTime(timeRemaining)}`
      : baseTitle;

    // Cleanup - restore original title when component unmounts
    return () => {
      document.title = 'FocusFlow';
    };
  }, [timeRemaining, timerMode, isRunning, formatTime, settings]);
};
