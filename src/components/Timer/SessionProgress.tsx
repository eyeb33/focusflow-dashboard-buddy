
import React from 'react';
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TimerMode } from '@/utils/timerContextUtils';

interface SessionProgressProps {
  completedSessions: number;
  sessionsUntilLongBreak: number;
  currentMode: TimerMode;
  className?: string;
}

const SessionProgress: React.FC<SessionProgressProps> = ({
  completedSessions,
  sessionsUntilLongBreak,
  currentMode,
  className
}) => {
  // Calculate current cycle progress
  const currentCycle = Math.floor(completedSessions / sessionsUntilLongBreak);
  const currentPositionInCycle = completedSessions % sessionsUntilLongBreak;
  
  // Determine which indicators to show based on current mode
  const showWorkIndicators = currentMode === 'work';
  const showBreakIndicators = currentMode === 'break';
  const showLongBreakIndicator = currentMode === 'longBreak';
  
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
  
  const renderIndicators = (mode: TimerMode, count: number, completed: number) => {
    const colors = getColor(mode);
    
    return Array.from({ length: count }).map((_, index) => (
      <Circle
        key={`${mode}-${index}`}
        size={16}
        className={cn(
          index < completed ? colors.fill : 'text-transparent',
          'stroke-[2px]',
          colors.stroke
        )}
      />
    ));
  };

  if (sessionsUntilLongBreak <= 0) {
    return <Skeleton className="h-4 w-full" />;
  }
  
  return (
    <div className={cn("flex justify-center items-center gap-2 py-3", className)}>
      {showWorkIndicators && (
        <div className="flex space-x-1">
          {renderIndicators('work', sessionsUntilLongBreak, currentPositionInCycle)}
        </div>
      )}
      
      {showBreakIndicators && (
        <div className="flex space-x-1">
          {renderIndicators('break', sessionsUntilLongBreak, currentPositionInCycle)}
        </div>
      )}
      
      {showLongBreakIndicator && (
        <div className="flex space-x-1">
          {renderIndicators('longBreak', 1, 1)}
        </div>
      )}
    </div>
  );
};

export default SessionProgress;
