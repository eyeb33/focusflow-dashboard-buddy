
import React, { useEffect } from 'react';
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
  
  // CRITICAL FIX: Ensure timeRemaining is capped by totalSeconds
  // This prevents displaying time higher than the intended duration
  const validTimeRemaining = Math.min(Math.max(0, timeRemaining), validTotalSeconds);
  
  const progress = Math.round(((validTotalSeconds - validTimeRemaining) / validTotalSeconds) * 100);

  // Format time for more readable logs
  const formatTimeForDisplay = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };
  
  // Enhanced debugging output with more useful information
  useEffect(() => {
    console.log("TimerDisplay rendering with:", {
      mode: timerMode, 
      actualTimeRemaining: timeRemaining,
      validatedTimeRemaining: validTimeRemaining,
      formattedTime: formatTimeForDisplay(validTimeRemaining),
      actualTotalSeconds: totalSeconds,
      validatedTotalSeconds: validTotalSeconds,
      progress: progress
    });
  }, [timerMode, timeRemaining, validTimeRemaining, totalSeconds, validTotalSeconds, progress]);

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
