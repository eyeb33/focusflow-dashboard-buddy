
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
  const strokeWidth = 8;
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

  // For debugging with more detail
  console.log(`TimerCircle - mode: ${mode}, progress: ${progress.toFixed(2)}%, secondsLeft: ${safeSecondsLeft}, totalSeconds: ${safeTotalSeconds}, minutes: ${minutes}, seconds: ${seconds}, formatted: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={theme === "dark" ? "#444" : "#e0e0e0"} // Theme-aware background
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
          style={{ transition: 'stroke-dashoffset 0.5s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <div className={cn(
          "text-5xl font-bold tracking-wider font-mono tabular-nums",
          theme === "dark" ? "text-white" : "text-gray-800"
        )}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
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
