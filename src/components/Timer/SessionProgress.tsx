
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
  const positionInCycle = currentSessionIndex % sessionsUntilLongBreak;
  
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
  const renderIndicators = () => {
    const colors = getColor(currentMode);
    
    return Array.from({ length: sessionsUntilLongBreak }).map((_, index) => {
      // In work mode: 
      // - Active is the current position in cycle
      // - Completed are positions before the active one
      
      // In break mode:
      // - Active is the position that just completed a work session
      // - No completed dots (breaks are interspersed between work sessions)
      
      // In long break mode:
      // - Just show a single active dot
      
      let isActive = false;
      let isCompleted = false;
      
      if (currentMode === 'work') {
        isActive = index === positionInCycle;
        isCompleted = index < positionInCycle;
      } 
      else if (currentMode === 'break') {
        // In break mode, highlight the position that just completed a work session
        isActive = index === positionInCycle;
        isCompleted = false;
      }
      else if (currentMode === 'longBreak') {
        // For long break, just show one active indicator
        isActive = index === 0;
        isCompleted = false;
      }
      
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
