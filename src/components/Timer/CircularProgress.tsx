import React, { useEffect } from 'react';
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  mode?: 'work' | 'break' | 'longBreak';
  children?: React.ReactNode;
  className?: string;
}

const CircularProgress = ({
  progress,
  size = 300,
  strokeWidth = 18,
  mode = 'work',
  children,
  className
}: CircularProgressProps) => {
  // Normalize progress to a value between 0 and 1
  const normalizedProgress = Math.min(Math.max(progress / 100, 0), 1);
  
  useEffect(() => {
    // Log progress value for debugging
    console.log(`CircularProgress: mode=${mode}, progress=${progress}, normalized=${normalizedProgress}`);
  }, [progress, mode, normalizedProgress]);
  
  // Calculate stroke colors based on mode
  const getStrokeColor = () => {
    switch (mode) {
      case 'break':
        return {
          bg: 'rgba(220, 245, 220, 0.3)', // Light green background
          fg: 'rgb(34, 197, 94)' // Green progress
        };
      case 'longBreak':
        return {
          bg: 'rgba(219, 234, 254, 0.3)', // Light blue background
          fg: 'rgb(59, 130, 246)' // Blue progress
        };
      case 'work':
      default:
        return {
          bg: 'rgba(254, 226, 226, 0.3)', // Light red background
          fg: 'rgb(239, 68, 68)' // Red progress
        };
    }
  };
  
  // SVG parameters for a 3/4 circle (270 degrees)
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius * (270 / 360); // 3/4 of the full circumference
  
  // Calculate the stroke dash offset - starts empty and fills up as progress increases
  const strokeDashoffset = circumference * (1 - normalizedProgress);
  
  // Start angle (135 degrees in radians)
  const startAngle = 135 * (Math.PI / 180);
  
  // Calculate path for the 3/4 arc
  const getArcPath = (radius: number) => {
    const start = {
      x: size / 2 + radius * Math.cos(startAngle),
      y: size / 2 + radius * Math.sin(startAngle)
    };
    
    // End angle (135 + 270 = 405 degrees in radians)
    const endAngle = (startAngle + 270 * (Math.PI / 180));
    
    const end = {
      x: size / 2 + radius * Math.cos(endAngle),
      y: size / 2 + radius * Math.sin(endAngle)
    };
    
    // Arc flag is 1 for arcs greater than 180 degrees
    const largeArcFlag = 1;
    
    return `M ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag},1 ${end.x},${end.y}`;
  };
  
  const colors = getStrokeColor();
  
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`${Math.round(normalizedProgress * 100)}% complete`}
        role="progressbar"
      >
        {/* Background arc - always visible */}
        <path
          d={getArcPath(radius)}
          fill="transparent"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Progress arc - visible based on progress */}
        <path
          d={getArcPath(radius)}
          fill="transparent"
          stroke={colors.fg}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
