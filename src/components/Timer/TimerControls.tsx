
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
  
  // Compute mode color via design tokens
  const getModeBg = (mode: string): string => {
    switch (mode) {
      case 'work':
        return 'hsl(var(--timer-focus-bg))';
      case 'break':
        return 'hsl(var(--timer-break-bg))';
      case 'longBreak':
        return 'hsl(var(--timer-longbreak-bg))';
      default:
        return 'hsl(var(--timer-focus-bg))';
    }
  };
  const buttonBg = getModeBg(mode);

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
          "shadow-lg hover:shadow-xl active:shadow-md"
        )}
        style={{ backgroundColor: buttonBg }}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
        type="button"
        data-testid={isRunning ? "pause-button" : "play-button"}
      >
        {isRunning ? (
          <Pause className="h-9 w-9 text-white" fill="white" />
        ) : (
          <svg 
            className="h-9 w-9 ml-1 text-white" 
            viewBox="0 0 24 24" 
            fill="white"
          >
            <path 
              d="M6 4.5C6 3.5 7 3 7.8 3.5L19 12L7.8 20.5C7 21 6 20.5 6 19.5V4.5Z" 
              rx="2"
              strokeLinejoin="round"
            />
          </svg>
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
