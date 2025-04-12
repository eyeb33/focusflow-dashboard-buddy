
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
      {!isRunning ? (
        <Button 
          onClick={onStart} 
          size="lg" 
          className="bg-pomodoro-work hover:bg-pomodoro-work/90 text-white rounded-full w-14 h-14 flex items-center justify-center"
        >
          <Play className="h-6 w-6" />
        </Button>
      ) : (
        <Button 
          onClick={onPause} 
          size="lg" 
          className="bg-pomodoro-work hover:bg-pomodoro-work/90 text-white rounded-full w-14 h-14 flex items-center justify-center"
        >
          <Pause className="h-6 w-6" />
        </Button>
      )}
      
      <Button 
        onClick={onReset} 
        variant="outline" 
        size="icon" 
        className="rounded-full w-10 h-10 border-slate-200"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      {onSkip && (
        <Button 
          onClick={onSkip} 
          variant="outline" 
          size="icon" 
          className="rounded-full w-10 h-10 border-slate-200"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default TimerControls;
