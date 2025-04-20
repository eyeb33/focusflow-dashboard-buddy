
import React from 'react';
import { cn } from '@/lib/utils';

interface SessionRingsProps {
  completedSessions: number;
  totalSessions: number;
  mode: "work" | "break" | "longBreak";
  className?: string;
  currentPosition?: number;
}

const SessionRings: React.FC<SessionRingsProps> = ({
  completedSessions,
  totalSessions,
  mode,
  className,
  currentPosition = 0
}) => {
  // Calculate current cycle (0-indexed)
  const currentCycle = Math.floor(completedSessions / totalSessions);
  
  // Calculate position in current cycle (0-indexed)
  const positionInCycle = currentPosition || (completedSessions % totalSessions);
  
  // Render work session circles (first row)
  const renderWorkCircles = () => {
    const circles = [];
    
    for (let i = 0; i < totalSessions; i++) {
      // Is this position completed or active?
      const isActive = mode === 'work' && positionInCycle === i;
      const isCompleted = i < positionInCycle && mode === 'work' || 
                         (mode !== 'work' && i <= positionInCycle);
      
      // Size the active indicator slightly larger
      const size = isActive ? 'w-4 h-4' : 'w-3 h-3';
      
      circles.push(
        <div
          key={`work-${i}`}
          className={cn(
            "rounded-full transition-colors duration-300",
            size,
            isActive ? "border-2 border-red-500" : "",
            isCompleted ? "bg-red-500" : "border-2 border-red-500"
          )}
        />
      );
    }
    
    return circles;
  };
  
  // Render break session circles (second row)
  const renderBreakCircles = () => {
    const circles = [];
    
    for (let i = 0; i < totalSessions - 1; i++) { // One less because last is long break
      const isActive = mode === 'break' && positionInCycle === i;
      const isCompleted = mode === 'longBreak' || 
                        (mode === 'break' && i < positionInCycle) || 
                        (i < positionInCycle - 1 && mode === 'work');
      
      const size = isActive ? 'w-4 h-4' : 'w-3 h-3';
      
      circles.push(
        <div
          key={`break-${i}`}
          className={cn(
            "rounded-full transition-colors duration-300",
            size,
            isActive ? "border-2 border-green-500" : "",
            isCompleted ? "bg-green-500" : "border-2 border-green-500"
          )}
        />
      );
    }
    
    return circles;
  };
  
  // Render long break circle (third row - just one)
  const renderLongBreakCircle = () => {
    const isActive = mode === 'longBreak';
    const isCompleted = false; // Only filled if completed full cycle
    
    return (
      <div
        className={cn(
          "rounded-full transition-colors duration-300",
          isActive ? "w-4 h-4" : "w-3 h-3",
          isActive ? "border-2 border-blue-500" : "",
          isCompleted ? "bg-blue-500" : "border-2 border-blue-500"
        )}
      />
    );
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Work sessions row (red) */}
      <div className="flex justify-center gap-2">
        {renderWorkCircles()}
      </div>
      
      {/* Break sessions row (green) */}
      <div className="flex justify-center gap-2">
        {renderBreakCircles()}
      </div>
      
      {/* Long break row (blue) - single circle */}
      <div className="flex justify-center">
        {renderLongBreakCircle()}
      </div>
    </div>
  );
};

export default SessionRings;
