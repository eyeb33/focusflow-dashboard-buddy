
import React, { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";
import { TimerMode } from '@/utils/timerContextUtils';

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
  // Animation state for countdown
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Debug log to see what values are being provided
  useEffect(() => {
    console.log('SessionProgress rendering with:', { 
      completedSessions, 
      sessionsUntilLongBreak, 
      currentMode, 
      currentSessionIndex, 
      isRunning,
      timeRemaining
    });
  }, [completedSessions, sessionsUntilLongBreak, currentMode, currentSessionIndex, isRunning, timeRemaining]);
  
  // Check if we're in the last 10 seconds
  useEffect(() => {
    if (timeRemaining <= 10 && timeRemaining > 0 && isRunning) {
      setIsPulsing(true);
    } else {
      setIsPulsing(false);
    }
  }, [timeRemaining, isRunning]);

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
  
  // Render indicator circles
  const renderIndicators = () => {
    const colors = getColor(currentMode);
    
    if (currentMode === 'work') {
      // Render work session indicators (red circles)
      return Array.from({ length: sessionsUntilLongBreak }).map((_, index) => {
        // A session is filled if its position is less than completedSessions
        const isFilled = index < completedSessions;
        
        // Is this the active position?
        const isActive = index === currentSessionIndex;
        
        // Size the active indicator slightly larger
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
        // A break is filled if previous work sessions are completed
        const isFilled = index < (completedSessions - 1);
        
        // Is this the active position?
        const isActive = index === currentSessionIndex;
        
        // Size the active indicator slightly larger
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
