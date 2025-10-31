
import React, { useCallback } from 'react';
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from '@/components/Theme/ThemeProvider';

interface TimerControlsProps {
  isRunning: boolean;
  mode?: 'work' | 'break' | 'longBreak';
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  mode = 'work',
  onStart,
  onPause,
  onReset
}) => {
  const { theme } = useTheme();
  
  // Get color based on timer mode and theme
  const getButtonColor = (mode: string): string => {
    if (theme === 'dark') {
      // Keep vibrant for dark mode
      switch (mode) {
        case 'work':
          return "bg-[#df1515] hover:bg-[#c91313] active:bg-[#b31111] shadow-soft hover:shadow-soft-lg";
        case 'break':
          return "bg-[#738f66] hover:bg-[#657f5a] active:bg-[#576f4e] shadow-soft hover:shadow-soft-lg";
        case 'longBreak':
          return "bg-[#70cccb] hover:bg-[#63b8b7] active:bg-[#56a4a3] shadow-soft hover:shadow-soft-lg";
        default:
          return "bg-[#df1515] hover:bg-[#c91313] active:bg-[#b31111] shadow-soft hover:shadow-soft-lg";
      }
    }
    
  // Light mode - new color palette
  switch (mode) {
    case 'work':
      return "bg-[#df1515] hover:bg-[#c91313] active:bg-[#b31111] shadow-soft hover:shadow-soft-lg";
    case 'break':
      return "bg-[#738f66] hover:bg-[#657f5a] active:bg-[#576f4e] shadow-soft hover:shadow-soft-lg";
    case 'longBreak':
      return "bg-[#70cccb] hover:bg-[#63b8b7] active:bg-[#56a4a3] shadow-soft hover:shadow-soft-lg";
    default:
      return "bg-[#df1515] hover:bg-[#c91313] active:bg-[#b31111] shadow-soft hover:shadow-soft-lg";
  }
  };
  
  const buttonColor = getButtonColor(mode);

  // Handle play/pause click
  const handlePlayPauseClick = useCallback((e: React.MouseEvent) => {
    // Prevent any default behavior and event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    if (isRunning) {
      onPause();
    } else {
      onStart();
    }
  }, [isRunning, onPause, onStart]);

  // Handle reset click
  const handleResetClick = useCallback((e: React.MouseEvent) => {
    // Prevent any default behavior and event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    onReset();
  }, [onReset]);

  return (
    <div className="flex gap-5 mt-6 mb-4" data-testid="timer-controls">
      <button 
        onClick={handlePlayPauseClick}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 interactive-scale",
          "shadow-lg hover:shadow-xl active:shadow-md",
          buttonColor
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
        type="button"
        data-testid={isRunning ? "pause-button" : "play-button"}
      >
        {isRunning ? (
          <Pause className="h-6 w-6 text-white" fill="white" />
        ) : (
          <Play className="h-6 w-6 ml-1 text-white" fill="white" />
        )}
      </button>
      
      <button 
        onClick={handleResetClick}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 interactive-scale",
          "shadow-lg hover:shadow-xl active:shadow-md",
          theme === "dark" 
            ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-800" 
            : "bg-gray-200 hover:bg-gray-300 active:bg-gray-100"
        )}
        aria-label="Reset timer"
        type="button"
        data-testid="reset-button"
      >
        <RotateCcw className={cn(
          "h-6 w-6",
          theme === "dark" ? "text-white" : "text-gray-700"
        )} />
      </button>
    </div>
  );
};

export default TimerControls;
