
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
          return "bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-soft hover:shadow-soft-lg";
        case 'break':
          return "bg-green-500 hover:bg-green-600 active:bg-green-700 shadow-soft hover:shadow-soft-lg";
        case 'longBreak':
          return "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-soft hover:shadow-soft-lg";
        default:
          return "bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-soft hover:shadow-soft-lg";
      }
    }
    
  // Light mode - vibrant reference colors
  switch (mode) {
    case 'work':
      return "bg-[#FF6B58] hover:bg-[#FF5545] active:bg-[#FF3F32] shadow-soft hover:shadow-soft-lg";
    case 'break':
      return "bg-[#4ECDC4] hover:bg-[#3EBDB4] active:bg-[#2EADA4] shadow-soft hover:shadow-soft-lg";
    case 'longBreak':
      return "bg-[#45B7D1] hover:bg-[#35A7C1] active:bg-[#2597B1] shadow-soft hover:shadow-soft-lg";
    default:
      return "bg-[#FF6B58] hover:bg-[#FF5545] active:bg-[#FF3F32] shadow-soft hover:shadow-soft-lg";
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
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 interactive-scale shine-on-hover",
          buttonColor
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
        type="button"
        data-testid={isRunning ? "pause-button" : "play-button"}
      >
        {isRunning ? (
          <Pause className={cn("h-5 w-5", theme === "dark" ? "text-white" : "text-white")} />
        ) : (
          <Play className={cn("h-5 w-5 ml-1", theme === "dark" ? "text-white" : "text-white")} />
        )}
      </button>
      
      <button 
        onClick={handleResetClick}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 interactive-scale shadow-soft hover:shadow-soft-lg",
          theme === "dark" 
            ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-800" 
            : "bg-secondary hover:bg-secondary/80 active:bg-secondary/70"
        )}
        aria-label="Reset timer"
        type="button"
        data-testid="reset-button"
      >
        <RotateCcw className={cn(
          "h-5 w-5",
          theme === "dark" ? "text-white" : "text-gray-700"
        )} />
      </button>
    </div>
  );
};

export default TimerControls;
