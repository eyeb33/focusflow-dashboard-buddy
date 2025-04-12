
import React from 'react';
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  mode?: 'work' | 'break' | 'longBreak';
  children?: React.ReactNode;
  className?: string;
}

const CircularProgress = ({
  progress,
  size = 300,
  strokeWidth = 10,
  mode = 'work',
  children,
  className
}: CircularProgressProps) => {
  // Ensure progress is between 0 and 1
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  
  // Calculate stroke colors based on mode
  const getStrokeColor = () => {
    switch (mode) {
      case 'break':
        return 'rgb(242, 252, 226)';
      case 'longBreak':
        return 'rgb(126, 105, 171)';
      case 'work':
      default:
        return 'rgb(155, 135, 245)';
    }
  };
  
  // SVG parameters
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - normalizedProgress);
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
