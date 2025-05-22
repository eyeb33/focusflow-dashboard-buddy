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
      
      // Store the current title information in the window context
      if (window.timerContext) {
        window.timerContext.currentTitle = {
          time: timeRemaining,
          mode: timerMode,
          running: isRunning
        };
      }
    };
    
    // Update title initially
    updateTitle();
    
    // Expose the update function to window context for other hooks to access
    if (!window.timerContext) window.timerContext = {};
    window.timerContext.updateDocumentTitle = updateTitle;

    // Set up an interval to update the title when tab is inactive
    // This helps ensure the title keeps updating even when the tab isn't focused
    const titleUpdateInterval = setInterval(() => {
      if (isRunning && document.hidden) {
        // Only update if we're running and the tab is hidden
        updateTitle();
      }
    }, 1000); // Update every second when tab is inactive

    // Cleanup - restore original title when component unmounts
    return () => {
      document.title = 'FocusFlow';
      clearInterval(titleUpdateInterval);
      
      if (window.timerContext) {
        window.timerContext.updateDocumentTitle = undefined;
        window.timerContext.currentTitle = undefined;
      }
    };
  }, [timeRemaining, timerMode, isRunning, formatTime, settings]);
};
