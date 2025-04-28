"use client";

import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
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
    startPause: "bg-red-500 hover:bg-red-600",
    reset: "text-red-500 hover:text-red-600",
  },
  break: {
    startPause: "bg-green-500 hover:bg-green-600",
    reset: "text-green-500 hover:text-green-600",
  },
  longBreak: {
    startPause: "bg-blue-500 hover:bg-blue-600",
    reset: "text-blue-500 hover:text-blue-600",
  },
};

export default function TimerControls({
  isRunning,
  onStart,
  onPause,
  onReset,
  mode,
  className,
}: TimerControlsProps) {
  const colors = modeColors[mode];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <Button
        onClick={isRunning ? onPause : onStart}
        className={cn("rounded-full w-14 h-14 p-0", colors.startPause)}
      >
        {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </Button>

      <Button
        onClick={onReset}
        variant="ghost"
        className={cn("rounded-full w-12 h-12 p-0", colors.reset)}
      >
        <RotateCcw className="w-5 h-5" />
      </Button>
    </div>
  );
}
