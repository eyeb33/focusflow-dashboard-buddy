
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip?: () => void;
  className?: string;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  onSkip,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      <Button 
        onClick={isRunning ? onPause : onStart} 
        size="lg" 
        className={cn(
          "rounded-full w-14 h-14 flex items-center justify-center shadow-md",
          isRunning ? "bg-white text-pomodoro-work hover:bg-gray-100" : "bg-pomodoro-work text-white hover:bg-pomodoro-work/90"
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
        variant="outline" 
        size="icon" 
        className="rounded-full w-10 h-10 border-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      {onSkip && (
        <Button 
          onClick={onSkip} 
          variant="outline" 
          size="icon" 
          className="rounded-full w-10 h-10 border-slate-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default TimerControls;
