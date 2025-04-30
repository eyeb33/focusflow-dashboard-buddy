
import React from 'react';

interface TimerCircleProps {
  secondsLeft: number;
  totalSeconds: number;
}

const TimerCircle: React.FC<TimerCircleProps> = ({ secondsLeft, totalSeconds }) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  
  // Calculate progress percentage (0-100)
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  
  // SVG parameters
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#333"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={progress === 100 ? "#4CAF50" : "#FF5252"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s' }}
        />
      </svg>
      <div className="absolute text-4xl font-bold">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  );
};

export default TimerCircle;
