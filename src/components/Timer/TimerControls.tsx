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
      color: "text-red-500",
      bgColor: "bg-red-500",
      hoverClass: "hover:bg-white hover:text-red-500",
      activeClass: "bg-red-500 text-white"
    },
    break: {
      color: "text-green-500",
      bgColor: "bg-green-500",
      hoverClass: "hover:bg-white hover:text-green-500",
      activeClass: "bg-green-500 text-white"
    },
    longBreak: {
      color: "text-blue-500",
      bgColor: "bg-blue-500",
      hoverClass: "hover:bg-white hover:text-blue-500",
      activeClass: "bg-blue-500 text-white"
    }
  };

  const currentModeColors = modeColors[mode];
  
  // Handle play/pause button click - CRITICAL: Keep this very simple
  const handlePlayPauseClick = () => {
    console.log("Play/Pause button clicked - current isRunning state:", isRunning);
    
    if (isRunning) {
      console.log("Pause button clicked - calling onPause() - should ONLY pause, not reset");
      onPause();
    } else {
      console.log("Play button clicked - calling onStart() - should resume or start");
      onStart();
    }
  };

  // Debug render
  console.log("TimerControls rendering with isRunning:", isRunning);

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <Button 
        onClick={handlePlayPauseClick}
        size="lg" 
        className={cn(
          "rounded-full w-14 h-14 flex items-center justify-center shadow-md transition-colors",
          isRunning 
            ? `bg-white ${currentModeColors.color} border border-slate-200 ${currentModeColors.hoverClass}` 
            : `${currentModeColors.activeClass} border border-transparent hover:bg-white hover:${currentModeColors.color}`
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
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
          currentModeColors.color
        )}
        aria-label="Reset timer"
      >
        <RotateCcw className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default TimerControls;
