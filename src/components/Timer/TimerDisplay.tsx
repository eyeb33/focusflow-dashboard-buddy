
import React from 'react';
import TimerCircle from './TimerCircle';
import { cn } from "@/lib/utils";
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerDisplayProps {
  timerMode: TimerMode;
  timeRemaining: number;
  totalSeconds: number;
  theme: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerMode,
  timeRemaining,
  totalSeconds,
  theme,
}) => {
  // Map timerMode to the format expected by TimerCircle
  const getTimerCircleMode = () => {
    switch(timerMode) {
      case 'work': return 'focus';
      case 'break': return 'break';
      case 'longBreak': return 'longBreak';
      default: return 'focus';
    }
  };

  // Check for valid values and calculate progress
  const validTotalSeconds = totalSeconds > 0 ? totalSeconds : 1;
  const validTimeRemaining = Math.min(timeRemaining, validTotalSeconds);
  const progress = Math.round(((validTotalSeconds - validTimeRemaining) / validTotalSeconds) * 100);

  // Debug output to check current values
  console.log("TimerDisplay rendering with:", {
    mode: timerMode,
    timeRemaining,
    totalSeconds: validTotalSeconds,
    progress: progress
  });

  return (
    <div className="relative flex flex-col items-center justify-center mt-2">
      <div className="text-center mb-2">
        <div className={cn(
          "text-xs rounded-full px-3 py-0.5 inline-block",
          theme === "dark" 
            ? "bg-gray-800 text-gray-200" 
            : "bg-gray-100 text-gray-700" 
        )}>
          {timerMode === 'work' ? 'Focus' : timerMode === 'break' ? 'Short Break' : 'Long Break'}
        </div>
      </div>
      
      <TimerCircle
        secondsLeft={validTimeRemaining}
        totalSeconds={validTotalSeconds}
        mode={getTimerCircleMode()}
      />
    </div>
  );
};

export default TimerDisplay;
