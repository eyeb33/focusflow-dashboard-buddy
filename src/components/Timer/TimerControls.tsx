
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
  // Handle play/pause button click
  const handlePlayPauseClick = () => {
    if (isRunning) {
      onPause();
    } else {
      onStart();
    }
  };

  return (
    <div className="flex gap-5 mt-6 mb-4">
      <button 
        onClick={handlePlayPauseClick}
        className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center transition-all hover:bg-red-600 active:bg-red-700"
        aria-label={isRunning ? "Pause timer" : "Start timer"}
      >
        {isRunning ? (
          <Pause className="h-5 w-5 text-white" />
        ) : (
          <Play className="h-5 w-5 text-white ml-1" />
        )}
      </button>
      
      <button 
        onClick={onReset}
        className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center transition-all hover:bg-gray-600 active:bg-gray-800"
        aria-label="Reset timer"
      >
        <RotateCcw className="h-5 w-5 text-white" />
      </button>
    </div>
  );
};

export default TimerControls;
