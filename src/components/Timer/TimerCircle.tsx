
import React from 'react';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";
import TimerMoodCharacter from './TimerMoodCharacter';

interface TimerCircleProps {
  secondsLeft: number;
  totalSeconds: number;
  mode?: 'focus' | 'break' | 'longBreak';
  isRunning?: boolean;
}

const TimerCircle: React.FC<TimerCircleProps> = ({ 
  secondsLeft, 
  totalSeconds,
  mode = 'focus',
  isRunning = false
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

  // Determine color based on mode and theme using design tokens
  const getColorVars = () => {
    switch (mode) {
      case 'break':
        return {
          solid: 'hsl(var(--timer-break-bg))',
          glow: 'hsl(var(--timer-break-bg) / 0.4)'
        };
      case 'longBreak':
        return {
          solid: 'hsl(var(--timer-longbreak-bg))',
          glow: 'hsl(var(--timer-longbreak-bg) / 0.4)'
        };
      case 'focus':
      default:
        return {
          solid: 'hsl(var(--timer-focus-bg))',
          glow: 'hsl(var(--timer-focus-bg) / 0.4)'
        };
    }
  };
  const colors = getColorVars();

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
      {/* Mood Character above timer */}
      <TimerMoodCharacter 
        mode={mode} 
        isRunning={isRunning}
        progress={progress}
      />
      
      {/* Soft glow effect - only when running */}
      {secondsLeft > 0 && secondsLeft < totalSeconds && (
        <div 
          className="absolute inset-0 rounded-full animate-glow"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
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
          <defs>
            <linearGradient id="ringHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="60%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {/* White center circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth / 2}
            fill={theme === "dark" ? "#1a1a1a" : "#ffffff"}
            className="drop-shadow-lg"
          />
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
            stroke={colors.solid}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: 'drop-shadow(0 0 6px ' + colors.glow + ')'
            }}
          />
          {/* Bubble highlight overlay */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - (strokeWidth / 2) + 1}
            fill="transparent"
            stroke="url(#ringHighlight)"
            strokeWidth={Math.max(2, strokeWidth * 0.2)}
          />
        </svg>
      </div>
      <div className="absolute flex flex-col items-center z-20">
        <div className={cn(
          "flex items-baseline justify-center",
          theme === "dark" ? "text-white" : "text-gray-900"
        )}>
          <span className="text-[3.9rem] font-extrabold tracking-tight font-mono tabular-nums font-[900]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {minutes.toString().padStart(2, '0')}
          </span>
          <span className="text-[2.8rem] font-extrabold tracking-tight font-mono tabular-nums font-[900]" style={{ fontVariantNumeric: 'tabular-nums' }}>
            :{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimerCircle;
