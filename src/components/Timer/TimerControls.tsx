import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  mode: "work" | "break" | "longBreak";
  className?: string;
}

const modeColors = {
  work: {
    startPauseColor: "bg-red-500 hover:bg-red-600",
    resetColor: "text-red-500 hover:text-red-600",
  },
  break: {
    startPauseColor: "bg-green-500 hover:bg-green-600",
    resetColor: "text-green-500 hover:text-green-600",
  },
  longBreak: {
    startPauseColor: "bg-blue-500 hover:bg-blue-600",
    resetColor: "text-blue-500 hover:text-blue-600",
  },
};

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  mode,
  className,
}) => {
  const colors = modeColors[mode];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Button
        onClick={isRunning ? onPause : onStart}
        className={cn(
          "rounded-full w-14 h-14 text-white transition",
          colors.startPauseColor
        )}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        {isRunning ? <Pause size={24} /> : <Play size={24} />}
      </Button>
      <Button
        onClick={onReset}
        variant="ghost"
        className={cn("rounded-full p-2 transition", colors.resetColor)}
        aria-label="Reset timer"
      >
        <RotateCcw size={22} />
      </Button>
    </div>
  );
};

export default TimerControls;
