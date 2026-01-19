
import React, { useEffect } from 'react';
import TimerCircle from './TimerCircle';
import { cn } from "@/lib/utils";
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerDisplayProps {
  timerMode: TimerMode;
  timeRemaining: number;
  totalSeconds: number;
  theme: string;
  isRunning?: boolean;
  isFreeStudy?: boolean;
  // Control handlers for compact controls inside circle
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  showControls?: boolean;
  // Session dots props
  totalSessions?: number;
  currentSessionIndex?: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerMode,
  timeRemaining,
  totalSeconds,
  theme,
  isRunning = false,
  isFreeStudy = false,
  onStart,
  onPause,
  onReset,
  showControls = false,
  totalSessions = 4,
  currentSessionIndex = 0,
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

  // Check for valid values
  const validTotalSeconds = isFreeStudy ? 1 : (totalSeconds > 0 ? totalSeconds : 1);
  const validTimeRemaining = isFreeStudy ? timeRemaining : Math.min(Math.max(0, timeRemaining), validTotalSeconds);

  return (
    <div className="flex-1 flex items-center justify-center">
      <TimerCircle
        secondsLeft={validTimeRemaining}
        totalSeconds={validTotalSeconds}
        mode={getTimerCircleMode()}
        isRunning={isRunning}
        isFreeStudy={isFreeStudy}
        onStart={onStart}
        onPause={onPause}
        onReset={onReset}
        showControls={showControls}
        totalSessions={totalSessions}
        currentSessionIndex={currentSessionIndex}
      />
    </div>
  );
};

export default TimerDisplay;
