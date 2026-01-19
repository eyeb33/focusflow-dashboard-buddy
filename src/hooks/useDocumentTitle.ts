
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

    const baseTitle = 'Syllabuddy';
    const circle = getCircleColor();
    
    // Format time for display
    const formattedTime = formatTime(timeRemaining);
    
    // Update document title immediately
    const updateTitle = () => {
      document.title = (isRunning || timeRemaining > 0)
        ? `${circle} ${formattedTime}`
        : baseTitle;
      
      console.log(`Document title updated: ${document.title} (running: ${isRunning}, time: ${timeRemaining})`);
    };
    
    // Update title immediately when state changes
    updateTitle();
    
    // Store the update function globally for other components to use
    if (!window.timerContext) window.timerContext = {};
    window.timerContext.updateDocumentTitle = updateTitle;
    window.timerContext.currentTitle = {
      time: timeRemaining,
      mode: timerMode,
      running: isRunning
    };

    // Cleanup - restore original title when component unmounts
    return () => {
      if (window.timerContext) {
        window.timerContext.updateDocumentTitle = undefined;
        window.timerContext.currentTitle = undefined;
      }
    };
  }, [timeRemaining, timerMode, isRunning, formatTime]);
};
