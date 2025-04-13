
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  mode: 'work' | 'break' | 'longBreak';
  className?: string;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  mode,
  className
}) => {
  // Color mapping for different modes
  const modeColors = {
    work: {
      startPauseColor: "bg-red-500",
      resetColor: "text-red-500"
    },
    break: {
      startPauseColor: "bg-green-500",
      resetColor: "text-green-500"
    },
    longBreak: {
      startPauseColor: "bg-blue-500",
      resetColor: "text-blue-500"
    }
  };

  const currentModeColors = modeColors[mode];

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <Button 
        onClick={isRunning ? onPause : onStart} 
        size="lg" 
        className={cn(
          "rounded-full w-14 h-14 flex items-center justify-center shadow-md",
          isRunning 
            ? `bg-white ${currentModeColors.resetColor} hover:bg-gray-100` 
            : `${currentModeColors.startPauseColor} text-white hover:opacity-90`
        )}
      >
        {!isRunning ? (
          <Play className="h-6 w-6" />
        ) : (
          <Pause className="h-6 w-6" />
        )}
      </Button>
      
      <Button 
        onClick={onReset} 
        size="lg"
        className={cn(
          "rounded-full w-14 h-14 flex items-center justify-center shadow-md bg-white hover:bg-gray-100 border border-slate-200",
          currentModeColors.resetColor
        )}
      >
        <RotateCcw className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default TimerControls;
