import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";

const TimerControls: React.FC = () => {
  const {
    isRunning,
    toggleTimer,
    resetTimer,
    skipSession,
  } = useTimer();

  return (
    <div className="flex justify-center space-x-4 mt-6">
      <Button variant="outline" onClick={resetTimer}>
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset
      </Button>
      <Button onClick={toggleTimer}>
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
      <Button variant="outline" onClick={skipSession}>
        <SkipForward className="w-4 h-4 mr-2" />
        Skip
      </Button>
    </div>
  );
};

export default TimerControls;
