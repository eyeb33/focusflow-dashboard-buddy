
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
  // Calculate current cycle (0-indexed)
  const currentCycle = Math.floor(completedSessions / sessionsUntilLongBreak);
  
  // Calculate position in cycle (0-indexed)
  const positionInCycle = completedSessions % sessionsUntilLongBreak;
  
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
  
  // Render indicator circles for focus sessions only
  const renderIndicators = () => {
    const colors = getColor(currentMode);
    
    return Array.from({ length: sessionsUntilLongBreak }).map((_, index) => {
      // Is this position completed?
      const isCompleted = index < positionInCycle;
      
      // Is this the active position?
      const isActive = index === positionInCycle;
      
      // Size the active indicator slightly larger
      const size = isActive ? 20 : 16;
      
      return (
        <Circle
          key={`${currentMode}-${index}`}
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
      <div className="flex space-x-1.5 items-center">
        {renderIndicators()}
      </div>
    </div>
  );
};

export default SessionProgress;
