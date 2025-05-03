
import React from 'react';

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
  // Use safe values to avoid NaN or issues with invalid inputs
  const safeSecondsLeft = isNaN(secondsLeft) ? 0 : Math.max(0, secondsLeft);
  const safeTotalSeconds = isNaN(totalSeconds) ? 1 : Math.max(1, totalSeconds);
  
  const minutes = Math.floor(safeSecondsLeft / 60);
  const seconds = safeSecondsLeft % 60;
  
  // Calculate progress percentage (0-100)
  const progress = safeTotalSeconds > 0 ? ((safeTotalSeconds - safeSecondsLeft) / safeTotalSeconds) * 100 : 0;
  
  // SVG parameters
  const size = 220;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

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
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#444"
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
        <div className="text-5xl font-bold tracking-wider">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-gray-400 text-xs mt-1">{getStatusText()}</div>
      </div>
    </div>
  );
};

export default TimerCircle;
