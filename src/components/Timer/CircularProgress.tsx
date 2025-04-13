import React from 'react';
import { cn } from '@/lib/utils';
import { TimerMode } from '@/utils/timerContextUtils';

interface CircularProgressProps {
  progress: number;
  mode: TimerMode;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  mode,
  size = 200,
  strokeWidth = 12,
  children,
  className
}) => {
  // Keep progress between 0 and 1
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  
  // Calculate circle parameters
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalizedProgress);
  
  // Mode-specific colors
  const getModeColor = () => {
    switch (mode) {
      case 'break':
        return 'bg-green-400';
      case 'longBreak':
        return 'bg-pomodoro-longBreak';
      case 'work':
      default:
        return 'bg-pomodoro-work';
    }
  };
  
  const getStrokeColor = () => {
    switch (mode) {
      case 'break':
        return 'stroke-green-400';
      case 'longBreak':
        return 'stroke-pomodoro-longBreak';
      case 'work':
      default:
        return 'stroke-pomodoro-work';
    }
  };
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Background track */}
      <svg width={size} height={size} className="transform rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="stroke-muted opacity-20"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(getStrokeColor())}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center inset-0">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
