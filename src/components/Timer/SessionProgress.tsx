
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
  const currentPositionInCycle = completedSessions % sessionsUntilLongBreak;
  
  // The active position is determined by the current session index
  const activePosition = currentSessionIndex;
  
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
  
  const renderIndicators = (mode: TimerMode, count: number, completed: number, active: number) => {
    const colors = getColor(mode);
    
    return Array.from({ length: count }).map((_, index) => {
      // Only mark as active if we're on this position
      const isActive = index === active;
      // Mark as completed if index < completedSessions
      const isCompleted = index < completed;
      const size = isActive ? 20 : 16;
      
      return (
        <Circle
          key={`${mode}-${index}`}
          size={size}
          className={cn(
            isCompleted || isActive ? colors.fill : 'text-transparent',
            'stroke-[2px] transition-all duration-300',
            colors.stroke
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
          {renderIndicators('work', sessionsUntilLongBreak, currentPositionInCycle, activePosition)}
        </div>
      )}
      
      {currentMode === 'break' && (
        <div className="flex space-x-1.5 items-center">
          {renderIndicators('break', sessionsUntilLongBreak, currentPositionInCycle, activePosition)}
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
