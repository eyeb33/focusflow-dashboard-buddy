
import React from 'react';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw } from "lucide-react";
import TimerMoodCharacter from './TimerMoodCharacter';
import { useTimerCalculations, getModeColors, type TimerMode } from '@/hooks/useTimerCalculations';

interface TimerCircleProps {
  secondsLeft: number;
  totalSeconds: number;
  mode?: 'focus' | 'break' | 'longBreak';
  isRunning?: boolean;
  isFreeStudy?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  showControls?: boolean;
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
  
  // Convert display mode to timer mode for calculations
  const timerMode: TimerMode = mode === 'focus' ? 'work' : mode;
  
  // Use shared timer calculations
  const {
    minutes,
    seconds,
    progress,
    circumference,
    dashOffset,
    colors,
    hasStarted,
  } = useTimerCalculations({
    timeRemaining: secondsLeft,
    totalSeconds,
    mode: timerMode,
    isFreeStudy,
  });
  
  // SVG parameters
  const size = 220;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;

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
    <div className="flex flex-col items-center">
      {/* Timer circle container */}
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

        {/* Mood Character above timer */}
        <TimerMoodCharacter 
          mode={mode} 
          isRunning={isRunning}
          progress={progress}
        />
        
        {/* Soft glow effect - only when running in pomodoro mode */}
        {!isFreeStudy && hasStarted && secondsLeft > 0 && (
          <div 
            className="absolute inset-0 rounded-full animate-glow"
            style={{
              background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
              transform: 'scale(1.1)'
            }}
          />
        )}
        
        <div className={cn(
          !isFreeStudy && hasStarted && secondsLeft > 0 && "animate-breathe",
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
                style={{ opacity: 0.6 }}
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

      {/* Control buttons - horizontal, underneath timer */}
      {showControls && (
        <div className="flex items-center justify-center gap-4 mt-2">
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
            <RotateCcw className="h-5 w-5" />
          </button>
          
          <button 
            onClick={handlePlayPauseClick}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
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
              <Pause className="h-7 w-7" fill="currentColor" />
            ) : (
              <svg 
                className="h-8 w-8 ml-0.5" 
                viewBox="0 0 24 24" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TimerCircle;
