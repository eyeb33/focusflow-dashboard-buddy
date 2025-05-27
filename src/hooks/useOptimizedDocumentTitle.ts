
import { useEffect } from 'react';
import { TimerMode } from '@/utils/timerContextUtils';

interface UseOptimizedDocumentTitleProps {
  timeRemaining: number;
  timerMode: TimerMode;
  isRunning: boolean;
}

export const useOptimizedDocumentTitle = ({ 
  timeRemaining, 
  timerMode, 
  isRunning 
}: UseOptimizedDocumentTitleProps) => {
  
  useEffect(() => {
    const getCircleColor = () => {
      switch (timerMode) {
        case 'work': return '🔴';
        case 'break': return '🟢';
        case 'longBreak': return '🔵';
        default: return '⚪';
      }
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const circle = getCircleColor();
    const formattedTime = formatTime(timeRemaining);
    
    document.title = (isRunning || timeRemaining > 0)
      ? `${circle} ${formattedTime}`
      : 'FocusFlow';
      
    console.log(`Document title updated: ${document.title}`);
  }, [timeRemaining, timerMode, isRunning]);
};
