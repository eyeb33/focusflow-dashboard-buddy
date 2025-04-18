
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
  currentPosition
}) => {
  // Generate the full sequence of dots for a complete cycle
  const renderSequence = () => {
    // Each work session is followed by a break, and the final one is followed by a long break
    // So the total number of dots is 2 * totalSessions (work + break for each)
    const sequence = [];
    
    for (let i = 0; i < totalSessions; i++) {
      // Add work session dot
      sequence.push("work");
      
      // Add break session dot (the last one is a long break)
      if (i === totalSessions - 1) {
        sequence.push("longBreak");
      } else {
        sequence.push("break");
      }
    }
    
    return sequence;
  };
  
  const sequence = renderSequence();
  
  const getDotColor = (dotType: string, isActive: boolean, isCompleted: boolean) => {
    if (isCompleted) {
      // Completed dots are filled
      switch (dotType) {
        case 'work': return 'bg-red-500';
        case 'break': return 'bg-green-500';
        case 'longBreak': return 'bg-blue-500';
      }
    } else if (isActive) {
      // Active but not completed dots have colored borders
      switch (dotType) {
        case 'work': return 'border-red-500';
        case 'break': return 'border-green-500';
        case 'longBreak': return 'border-blue-500';
      }
    }
    
    // Inactive and not completed dots have muted background
    return 'bg-muted';
  };

  return (
    <div className={cn("flex justify-center gap-2", className)}>
      {sequence.map((dotType, index) => {
        // A position is completed if it's less than currentPosition
        const isCompleted = currentPosition !== undefined && index < currentPosition;
        
        // A position is active if it equals currentPosition
        const isActive = currentPosition !== undefined && index === currentPosition;
        
        return (
          <div
            key={index}
            className={cn(
              "rounded-full transition-colors duration-300",
              isActive ? "w-4 h-4" : "w-3 h-3", 
              isActive && !isCompleted ? "border-2" : "",
              getDotColor(dotType, isActive, isCompleted)
            )}
          />
        );
      })}
    </div>
  );
};

export default SessionRings;
