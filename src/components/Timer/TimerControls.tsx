
import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TimerControlsProps {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSkip?: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onToggle,
  onReset,
  onSkip
}) => {
  return (
    <div className="flex justify-center space-x-4 mt-6">
      <Button variant="outline" onClick={onReset}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
      <Button onClick={onToggle}>
        {isRunning ? (
          <>
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Start
          </>
        )}
      </Button>
      {onSkip && (
        <Button variant="outline" onClick={onSkip}>
          <SkipForward className="w-4 h-4 mr-2" />
          Skip
        </Button>
      )}
    </div>
  );
};

export default TimerControls;
