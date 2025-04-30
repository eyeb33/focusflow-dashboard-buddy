
import React from 'react';
import { Pause, Play, RotateCcw } from "lucide-react";

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onStart,
  onPause,
  onReset
}) => {
  return (
    <div className="flex gap-5 mt-6 mb-4">
      <button 
        onClick={isRunning ? onPause : onStart}
        className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"
      >
        {isRunning ? (
          <Pause className="h-5 w-5 text-white" />
        ) : (
          <Play className="h-5 w-5 text-white ml-1" />
        )}
      </button>
      
      <button 
        onClick={onReset}
        className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center"
      >
        <RotateCcw className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};

export default TimerControls;
