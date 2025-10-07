
import React from 'react';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";

interface TimerCircleProps {
  secondsLeft: number;
  totalSeconds: number;
  mode?: 'focus' | 'break' | 'longBreak';
}

const TimerCircle: React.FC<TimerCircleProps> = ({ 
  secondsLeft, 
  totalSeconds,
  mode = 'focus' 
}) => {
  const { theme } = useTheme();
  
  // Use safe values to avoid NaN or issues with invalid inputs
  const safeSecondsLeft = isNaN(secondsLeft) ? 0 : Math.max(0, secondsLeft);
  const safeTotalSeconds = isNaN(totalSeconds) ? 1 : Math.max(1, totalSeconds);
  
  const minutes = Math.floor(safeSecondsLeft / 60);
  const seconds = safeSecondsLeft % 60;
  
  // Calculate progress percentage (0-100)
  // This should increase as time decreases (from 0% at start to 100% when done)
  const progress = safeTotalSeconds > 0 ? ((safeTotalSeconds - safeSecondsLeft) / safeTotalSeconds) * 100 : 0;
  
  // SVG parameters
  const size = 220;
  const strokeWidth = 15; // Updated to 15px to match CircularProgress
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dashoffset (less offset = more circle shown)
  // At 0% progress we want full offset (empty circle)
  // At 100% progress we want 0 offset (full circle)
  const dashOffset = circumference * (1 - progress / 100);

  // Determine color based on mode
  const getProgressColor = () => {
    switch (mode) {
      case 'break':
        return "#2fc55e"; // Green for break
      case 'longBreak':
        return "#3b81f6"; // Blue for long break
      case 'focus':
      default:
        return "#ff4545"; // Red for focus
    }
  };

  // Get text for the status message
  const getStatusText = () => {
    switch (mode) {
      case 'break':
        return "Take a short break";
      case 'longBreak':
        return "Enjoy your long break";
      case 'focus':
      default:
        return "Focus on your task";
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Soft glow effect - only when running */}
      {secondsLeft > 0 && secondsLeft < totalSeconds && (
        <div 
          className="absolute inset-0 rounded-full animate-glow"
          style={{
            background: `radial-gradient(circle, ${getProgressColor()}40 0%, transparent 70%)`,
            transform: 'scale(1.1)'
          }}
        />
      )}
      
      <div className={cn(secondsLeft > 0 && secondsLeft < totalSeconds && "animate-breathe")}
      >
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90 relative z-10"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={theme === "dark" ? "#2a2a2a" : "#f0f0f0"}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={getProgressColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: 'drop-shadow(0 0 6px ' + getProgressColor() + '40)'
            }}
          />
        </svg>
      </div>
      <div className="absolute flex flex-col items-center z-20">
        <div className={cn(
          "tabular-nums flex items-baseline justify-center gap-1",
          theme === "dark" ? "text-white" : "text-gray-800"
        )}>
          <span className="text-[3.9rem] font-extrabold tracking-tight font-ubuntu-mono font-[800]">
            {minutes.toString().padStart(2, '0')}
          </span>
          <span className="text-[2.8rem] font-extrabold tracking-tight font-ubuntu-mono font-[800]">
            :{seconds.toString().padStart(2, '0')}
          </span>
        </div>
        <div className={cn(
          "text-xs mt-1",
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        )}>
          {getStatusText()}
        </div>
      </div>
    </div>
  );
};

export default TimerCircle;
