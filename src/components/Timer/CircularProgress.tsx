
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
  strokeWidth = 15,
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
        return {
          bg: 'rgba(128, 128, 128, 0.2)',
          fg: 'rgb(242, 252, 226)'
        };
      case 'longBreak':
        return {
          bg: 'rgba(128, 128, 128, 0.2)',
          fg: 'rgb(126, 105, 171)'
        };
      case 'work':
      default:
        return {
          bg: 'rgba(128, 128, 128, 0.2)',
          fg: 'rgb(155, 135, 245)'
        };
    }
  };
  
  // SVG parameters for a 3/4 circle (270 degrees)
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius * (270 / 360); // 3/4 of the full circumference
  
  // Calculate the stroke dash offset - starts empty and fills up from left to right
  const strokeDashoffset = circumference * (1 - normalizedProgress);
  
  // Calculate start angle (135 degrees in radians)
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
      >
        {/* Background arc */}
        <path
          d={getArcPath(radius)}
          fill="transparent"
          stroke={colors.bg}
          className="dark:stroke-gray-700/50"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Progress arc */}
        <path
          d={getArcPath(radius)}
          fill="transparent"
          stroke={colors.fg}
          className="dark:stroke-purple-400 transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
