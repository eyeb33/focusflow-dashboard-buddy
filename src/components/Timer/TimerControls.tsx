
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
  
  // Get color based on timer mode
  const getButtonColor = (mode: string): string => {
    switch (mode) {
      case 'work':
        return "bg-red-500 hover:bg-red-600 active:bg-red-700";
      case 'break':
        return "bg-green-500 hover:bg-green-600 active:bg-green-700";
      case 'longBreak':
        return "bg-blue-500 hover:bg-blue-600 active:bg-blue-700";
      default:
        return "bg-red-500 hover:bg-red-600 active:bg-red-700";
    }
  };
  
  const buttonColor = getButtonColor(mode);

  // Use memoized handlers to prevent unnecessary re-renders
  const handlePlayPauseClick = useCallback((e: React.MouseEvent) => {
    // Prevent any default behavior and event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    // Log current state for debugging
    console.log(`Play/Pause button clicked, isRunning: ${isRunning}, mode: ${mode}`);
    
    if (isRunning) {
      console.log("Calling onPause from TimerControls");
      onPause();
    } else {
      console.log("Calling onStart from TimerControls");
      onStart();
    }
    
    // Extra logging after button click
    console.log(`Button action completed: ${isRunning ? 'Pause' : 'Start'}`);
  }, [isRunning, onPause, onStart, mode]);

  const handleResetClick = useCallback((e: React.MouseEvent) => {
    // Prevent any default behavior and event bubbling
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Reset button clicked from TimerControls");
    onReset();
  }, [onReset]);

  return (
    <div className="flex gap-5 mt-6 mb-4">
      <button 
        onClick={handlePlayPauseClick}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          buttonColor
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
        type="button"
        data-testid={isRunning ? "pause-button" : "play-button"}
      >
        {isRunning ? (
          <Pause className="h-5 w-5 text-white" />
        ) : (
          <Play className="h-5 w-5 text-white ml-1" />
        )}
      </button>
      
      <button 
        onClick={handleResetClick}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          theme === "dark" 
            ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-800" 
            : "bg-gray-300 hover:bg-gray-400 active:bg-gray-500"
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
