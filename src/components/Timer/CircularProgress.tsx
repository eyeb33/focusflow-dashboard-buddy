
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
  strokeWidth = 16, // Increased thickness
  children,
  className
}) => {
  // Keep progress between 0 and 1
  const normalizedProgress = Math.min(1, Math.max(0, progress || 0));
  
  // Calculate circle parameters
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate start and end angles for 3/4 circle (open at bottom)
  const startAngle = -Math.PI / 4; // -45 degrees
  const endAngle = startAngle + (Math.PI * 1.5); // -45 + 270 = 225 degrees
  
  // Calculate the path for a 3/4 circle
  const getArcPath = (r: number) => {
    const x1 = size / 2 + r * Math.cos(startAngle);
    const y1 = size / 2 + r * Math.sin(startAngle);
    const x2 = size / 2 + r * Math.cos(endAngle);
    const y2 = size / 2 + r * Math.sin(endAngle);
    const largeArcFlag = 1; // 1 for angles > 180 degrees
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };
  
  // Calculate the progress along the arc
  const strokeDashoffset = circumference * (1 - normalizedProgress * 0.75);
  
  // Mode-specific colors
  const getStrokeColor = () => {
    switch (mode) {
      case 'break':
      case 'longBreak':
        return 'stroke-green-500';
      case 'work':
      default:
        return 'stroke-red-500';
    }
  };
  
  const getTrackColor = () => {
    switch (mode) {
      case 'break':
      case 'longBreak':
        return 'stroke-green-100 dark:stroke-green-900/30';
      case 'work':
      default:
        return 'stroke-red-100 dark:stroke-red-900/30';
    }
  };
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg width={size} height={size}>
        {/* Background track */}
        <path
          d={getArcPath(radius)}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn(getTrackColor())}
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        <path
          d={getArcPath(radius)}
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
