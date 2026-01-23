
import React from 'react';
import TimerCircle from './TimerCircle';
import { toDisplayMode, type TimerMode } from '@/hooks/useTimerCalculations';

interface TimerDisplayProps {
  timerMode: TimerMode;
  timeRemaining: number;
  totalSeconds: number;
  theme: string;
  isRunning?: boolean;
  isFreeStudy?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  showControls?: boolean;
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
  // Use shared mode conversion
  const displayMode = toDisplayMode(timerMode);

  // Check for valid values
  const validTotalSeconds = isFreeStudy ? 1 : (totalSeconds > 0 ? totalSeconds : 1);
  const validTimeRemaining = isFreeStudy ? timeRemaining : Math.min(Math.max(0, timeRemaining), validTotalSeconds);

  return (
    <div className="flex-1 flex items-center justify-center">
      <TimerCircle
        secondsLeft={validTimeRemaining}
        totalSeconds={validTotalSeconds}
        mode={displayMode}
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
