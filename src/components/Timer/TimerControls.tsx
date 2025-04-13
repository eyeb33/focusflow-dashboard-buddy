
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  className?: string;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <Button 
        onClick={isRunning ? onPause : onStart} 
        size="lg" 
        className={cn(
          "rounded-full w-14 h-14 flex items-center justify-center shadow-md",
          isRunning 
            ? "bg-white text-red-500 hover:bg-gray-100" 
            : "bg-red-500 text-white hover:bg-red-600"
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
        className="rounded-full w-14 h-14 flex items-center justify-center shadow-md bg-white text-red-500 hover:bg-gray-100 border border-slate-200"
      >
        <RotateCcw className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default TimerControls;
