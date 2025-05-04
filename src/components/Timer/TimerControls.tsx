
import React from 'react';
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

  // Handle play/pause button click
  const handlePlayPauseClick = () => {
    console.log("Play/Pause clicked, isRunning:", isRunning);
    if (isRunning) {
      onPause();
    } else {
      onStart();
    }
  };

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
      >
        {isRunning ? (
          <Pause className="h-5 w-5 text-white" />
        ) : (
          <Play className="h-5 w-5 text-white ml-1" />
        )}
      </button>
      
      <button 
        onClick={onReset}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          theme === "dark" 
            ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-800" 
            : "bg-gray-300 hover:bg-gray-400 active:bg-gray-500"
        )}
        aria-label="Reset timer"
        type="button"
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
