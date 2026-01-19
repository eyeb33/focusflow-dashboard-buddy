
import React from 'react';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw } from "lucide-react";
import TimerMoodCharacter from './TimerMoodCharacter';

interface TimerCircleProps {
  secondsLeft: number;
  totalSeconds: number;
  mode?: 'focus' | 'break' | 'longBreak';
  isRunning?: boolean;
  isFreeStudy?: boolean;
  // Compact controls inside the circle
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  showControls?: boolean;
  // Session dots props
  totalSessions?: number;
  currentSessionIndex?: number;
}

const TimerCircle: React.FC<TimerCircleProps> = ({ 
  secondsLeft, 
  totalSeconds,
  mode = 'focus',
  isRunning = false,
  isFreeStudy = false,
  onStart,
  onPause,
  onReset,
  showControls = false,
  totalSessions = 4,
  currentSessionIndex = 0
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

  // Handle play/pause click
  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRunning) {
      onPause?.();
    } else {
      onStart?.();
    }
  };

  // Handle reset click
  const handleResetClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReset?.();
  };

  return (
    <div className="relative flex items-center justify-center p-6 overflow-visible">
      {/* Session dots - vertical, left of timer */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 -ml-2">
        {!isFreeStudy ? (
          Array.from({ length: totalSessions }).map((_, dotIndex) => {
            const isActive = dotIndex === currentSessionIndex;
            const isComplete = dotIndex < currentSessionIndex;
            
            return (
              <div
                key={dotIndex}
                className={cn(
                  "rounded-full transition-all duration-300",
                  isActive ? "w-4 h-4" : "w-3 h-3"
                )}
                style={{
                  backgroundColor: isActive || isComplete
                    ? colors.solid
                    : theme === "dark" ? "#444" : "#d1d5db"
                }}
              />
            );
          })
        ) : (
          // Greyed out dots for free study
          Array.from({ length: 4 }).map((_, dotIndex) => (
            <div
              key={dotIndex}
              className="w-3 h-3 rounded-full opacity-30"
              style={{ backgroundColor: theme === "dark" ? "#444" : "#d1d5db" }}
            />
          ))
        )}
      </div>

      {/* Control buttons - vertical, right of timer */}
      {showControls && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 -mr-2">
          <button 
            onClick={handleResetClick}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
              "hover:scale-110 active:scale-95",
              theme === "dark" 
                ? "bg-white/10 hover:bg-white/20 text-white/70" 
                : "bg-black/5 hover:bg-black/10 text-gray-500"
            )}
            aria-label="Reset timer"
            type="button"
            data-testid="reset-button"
          >
            <RotateCcw className="h-6 w-6" />
          </button>
          
          <button 
            onClick={handlePlayPauseClick}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200",
              "hover:scale-110 active:scale-95",
              theme === "dark" 
                ? "bg-white/10 hover:bg-white/20" 
                : "bg-black/5 hover:bg-black/10"
            )}
            style={{ color: colors.solid }}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
            type="button"
            data-testid={isRunning ? "pause-button" : "play-button"}
          >
            {isRunning ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <svg 
                className="h-6 w-6 ml-0.5" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeLinejoin="round"
              >
                <path d="M6 4.5 L6 19.5 L20 12 Z" rx="2" ry="2" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Mood Character above timer */}
      <TimerMoodCharacter 
        mode={mode} 
        isRunning={isRunning}
        progress={progress}
      />
      
      {/* Soft glow effect - only when running in pomodoro mode */}
      {!isFreeStudy && secondsLeft > 0 && secondsLeft < totalSeconds && (
        <div 
          className="absolute inset-0 rounded-full animate-glow"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            transform: 'scale(1.1)'
          }}
        />
      )}
      
      <div className={cn(
        !isFreeStudy && secondsLeft > 0 && secondsLeft < totalSeconds && "animate-breathe",
        isFreeStudy && isRunning && "animate-breathe-slow"
      )}>
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
          {/* Progress circle - different for free study vs pomodoro */}
          {isFreeStudy ? (
            // Free study: soft light blue full ring
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={theme === "dark" ? "hsl(200, 60%, 40%)" : "hsl(200, 70%, 75%)"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ 
                opacity: 0.6
              }}
            />
          ) : (
            // Pomodoro: progress-based ring
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
          )}
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
      
      {/* Time display */}
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
