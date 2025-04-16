
import React from 'react';
import { cn } from '@/lib/utils';

interface SessionRingsProps {
  completedSessions: number;
  totalSessions: number;
  mode: "work" | "break";
  className?: string;
  currentPosition?: number;
}

const SessionRings: React.FC<SessionRingsProps> = ({
  completedSessions,
  totalSessions,
  mode,
  className,
  currentPosition
}) => {
  const activeColor = mode === "work" ? "bg-red-500" : "bg-green-500";
  const activeStroke = mode === "work" ? "border-red-500" : "border-green-500";

  return (
    <div className={cn("flex justify-center gap-2", className)}>
      {[...Array(totalSessions)].map((_, index) => {
        const isCompleted = index < completedSessions;
        const isActive = currentPosition !== undefined && index === currentPosition;
        
        return (
          <div
            key={index}
            className={cn(
              "rounded-full transition-colors duration-300",
              isActive ? "w-4 h-4" : "w-3 h-3", 
              isCompleted ? activeColor : "bg-muted",
              isActive && !isCompleted && "border-2", 
              isActive && !isCompleted && activeStroke
            )}
          />
        );
      })}
    </div>
  );
};

export default SessionRings;
