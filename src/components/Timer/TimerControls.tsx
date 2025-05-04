
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
  const handlePlayPauseClick = useCallback(() => {
    console.log("Play/Pause clicked, isRunning:", isRunning);
    if (isRunning) {
      console.log("Pausing timer from controls");
      onPause();
    } else {
      console.log("Starting timer from controls");
      onStart();
    }
  }, [isRunning, onPause, onStart]);

  const handleResetClick = useCallback(() => {
    console.log("Reset clicked from controls");
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
            : "bg-gray-300 hover:bg-gray-400 active:bg-gray-500" // Lighter gray for light mode
        )}
        aria-label="Reset timer"
        type="button"
        data-testid="reset-button"
      >
        <RotateCcw className={cn(
          "h-5 w-5",
          theme === "dark" ? "text-white" : "text-gray-700" // Darker text for light mode
        )} />
      </button>
    </div>
  );
};

export default TimerControls;
