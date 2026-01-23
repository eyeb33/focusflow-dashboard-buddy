
import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { useTimerCalculations, getModeColors, type TimerMode } from '@/hooks/useTimerCalculations';

interface SessionProgressProps {
  completedSessions: number;
  sessionsUntilLongBreak: number;
  currentMode: TimerMode;
  currentSessionIndex: number;
  isRunning: boolean;
  className?: string;
  timeRemaining?: number;
}

const SessionProgress: React.FC<SessionProgressProps> = ({
  completedSessions,
  sessionsUntilLongBreak,
  currentMode,
  currentSessionIndex,
  isRunning,
  className,
  timeRemaining = 0
}) => {
  // Use shared calculations for last 10 seconds pulse
  const { isLastTenSeconds } = useTimerCalculations({
    timeRemaining,
    totalSeconds: 1, // Not needed for this check
    mode: currentMode,
  });
  
  // Get colors using shared utility
  const colors = useMemo(() => getModeColors(currentMode), [currentMode]);
  
  // Determine if we should pulse
  const isPulsing = isRunning && isLastTenSeconds;
  
  // Render indicator circles
  const renderIndicators = () => {
    if (currentMode === 'work') {
      // Render work session indicators (red circles)
      return Array.from({ length: sessionsUntilLongBreak }).map((_, index) => {
        const isFilled = index < completedSessions;
        const isActive = index === currentSessionIndex;
        const size = isActive ? 20 : 16;
        
        return (
          <Circle
            key={`work-${index}`}
            size={size}
            className={cn(
              'text-transparent',
              isFilled ? colors.fill : '',
              isActive ? 'stroke-[2.5px]' : 'stroke-[2px]',
              isActive ? colors.fill : colors.stroke,
              isPulsing && isActive ? 'animate-pulse-slow' : '',
              'transition-all duration-300'
            )}
          />
        );
      });
    } else if (currentMode === 'break') {
      // Render break indicators (green circles)
      const numBreaks = sessionsUntilLongBreak - 1;
      
      return Array.from({ length: numBreaks }).map((_, index) => {
        const isFilled = index < (completedSessions - 1);
        const isActive = index === currentSessionIndex;
        const size = isActive ? 20 : 16;
        
        return (
          <Circle
            key={`break-${index}`}
            size={size}
            className={cn(
              'text-transparent',
              isFilled ? colors.fill : '',
              isActive ? 'stroke-[2.5px]' : 'stroke-[2px]',
              isActive ? colors.fill : colors.stroke,
              isPulsing && isActive ? 'animate-pulse-slow' : '',
              'transition-all duration-300'
            )}
          />
        );
      });
    } else if (currentMode === 'longBreak') {
      // Render long break indicator (single blue circle)
      return [
        <Circle
          key="long-break"
          size={24}
          className={cn(
            'text-transparent',
            'stroke-[2.5px]',
            colors.fill,
            isPulsing ? 'animate-pulse-slow' : '',
            'transition-all duration-300'
          )}
        />
      ];
    }
    
    return [];
  };

  return (
    <div className={cn("flex justify-center items-center gap-2 py-3", className)}>
      <div className="flex space-x-1.5 items-center">
        {renderIndicators()}
      </div>
    </div>
  );
};

export default SessionProgress;
