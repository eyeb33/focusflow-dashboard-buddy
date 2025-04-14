
import React from 'react';
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TimerMode } from '@/utils/timerContextUtils';

interface SessionProgressProps {
  completedSessions: number;
  sessionsUntilLongBreak: number;
  currentMode: TimerMode;
  currentSessionIndex: number;
  isRunning: boolean;
  className?: string;
}

const SessionProgress: React.FC<SessionProgressProps> = ({
  completedSessions,
  sessionsUntilLongBreak,
  currentMode,
  currentSessionIndex,
  isRunning,
  className
}) => {
  // Calculate current cycle progress
  const currentCycle = Math.floor(completedSessions / sessionsUntilLongBreak);
  
  // Calculate position in cycle (for both work and break sessions)
  const currentPositionInCycle = completedSessions % sessionsUntilLongBreak;
  
  // Get colors based on timer mode
  const getColor = (mode: TimerMode): { fill: string, stroke: string } => {
    switch (mode) {
      case 'work':
        return { fill: 'text-red-500', stroke: 'text-red-200' };
      case 'break':
        return { fill: 'text-green-500', stroke: 'text-green-200' };
      case 'longBreak':
        return { fill: 'text-blue-500', stroke: 'text-blue-200' };
      default:
        return { fill: 'text-gray-500', stroke: 'text-gray-200' };
    }
  };
  
  // Render indicator circles for the current mode
  const renderIndicators = (mode: TimerMode, count: number, completedCount: number, activeIndex: number) => {
    const colors = getColor(mode);
    
    return Array.from({ length: count }).map((_, index) => {
      let isActive = false;
      let isCompleted = false;
      
      // Mark as active if this is the current position in the cycle
      if (mode === 'work') {
        isActive = index === activeIndex;
        isCompleted = index < completedCount;
      } 
      else if (mode === 'break') {
        isActive = index === activeIndex;
        isCompleted = index < completedCount;
      }
      else if (mode === 'longBreak') {
        isActive = true;
        isCompleted = false;
      }
      
      // Size the active indicator slightly larger
      const size = isActive ? 20 : 16;
      
      return (
        <Circle
          key={`${mode}-${index}`}
          size={size}
          className={cn(
            isCompleted ? colors.fill : 'text-transparent',
            isActive && !isCompleted ? 'stroke-[2.5px]' : 'stroke-[2px]',
            isActive ? colors.fill : colors.stroke,
            'transition-all duration-300'
          )}
        />
      );
    });
  };

  if (sessionsUntilLongBreak <= 0) {
    return <Skeleton className="h-4 w-full" />;
  }
  
  return (
    <div className={cn("flex justify-center items-center gap-2 py-3", className)}>
      {currentMode === 'work' && (
        <div className="flex space-x-1.5 items-center">
          {renderIndicators('work', sessionsUntilLongBreak, currentPositionInCycle, currentSessionIndex)}
        </div>
      )}
      
      {currentMode === 'break' && (
        <div className="flex space-x-1.5 items-center">
          {renderIndicators('break', sessionsUntilLongBreak, currentPositionInCycle, currentSessionIndex)}
        </div>
      )}
      
      {currentMode === 'longBreak' && (
        <div className="flex space-x-1.5 items-center">
          {renderIndicators('longBreak', 1, 0, 0)}
        </div>
      )}
    </div>
  );
};

export default SessionProgress;
