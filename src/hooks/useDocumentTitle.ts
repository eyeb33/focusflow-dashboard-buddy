
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseDocumentTitleProps {
  timeRemaining: number;
  timerMode: TimerMode;
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
          return '🔴'; // Red circle for focus
        case 'break':
          return '🟢'; // Green circle for break
        case 'longBreak':
          return '🔵'; // Blue circle for long break
        default:
          return '⚪';
      }
    };

    const baseTitle = 'FocusFlow';
    const circle = getCircleColor();
    
    // Format time for display
    const formattedTime = formatTime(timeRemaining);
    
    // Create a function to update the document title that can be called from visibility handlers
    const updateTitle = () => {
      // When timer is running or has time remaining, show the circle and time
      // When idle, show the app name
      document.title = (isRunning || timeRemaining > 0)
        ? `${circle} ${formattedTime}`
        : baseTitle;
    };
    
    // Update title initially
    updateTitle();
    
    // Expose the update function to window context for other hooks to access
    if (!window.timerContext) window.timerContext = {};
    window.timerContext.updateDocumentTitle = updateTitle;

    // Cleanup - restore original title when component unmounts
    return () => {
      document.title = 'FocusFlow';
      if (window.timerContext) {
        window.timerContext.updateDocumentTitle = undefined;
      }
    };
  }, [timeRemaining, timerMode, isRunning, formatTime, settings]);
};
