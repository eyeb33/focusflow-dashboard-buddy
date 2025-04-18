
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
  // Generate pairs of circles for the sequence
  const renderSequence = () => {
    const pairs = [];
    
    // Create pairs for each work+break sequence
    for (let i = 0; i < totalSessions; i++) {
      const pairIndex = i * 2; // Each pair has 2 positions (work + break)
      
      // Create a pair container
      pairs.push(
        <div key={i} className="flex flex-col gap-1">
          {/* Work session circle */}
          <div
            className={cn(
              "rounded-full transition-colors duration-300",
              currentPosition === pairIndex ? "w-4 h-4" : "w-3 h-3",
              currentPosition === pairIndex && !isCompleted(pairIndex) ? "border-2 border-red-500" : "",
              isCompleted(pairIndex) ? "bg-red-500" : "border-2 border-red-500"
            )}
          />
          {/* Break session circle (last one is long break) */}
          <div
            className={cn(
              "rounded-full transition-colors duration-300",
              currentPosition === pairIndex + 1 ? "w-4 h-4" : "w-3 h-3",
              currentPosition === pairIndex + 1 && !isCompleted(pairIndex + 1) ? "border-2" : "",
              i === totalSessions - 1 ? (
                isCompleted(pairIndex + 1) ? "bg-blue-500" : "border-2 border-blue-500"
              ) : (
                isCompleted(pairIndex + 1) ? "bg-green-500" : "border-2 border-green-500"
              )
            )}
          />
        </div>
      );
    }
    
    return pairs;
  };
  
  const isCompleted = (position: number) => {
    return currentPosition !== undefined && position < currentPosition;
  };

  return (
    <div className={cn("flex justify-center gap-4", className)}>
      {renderSequence()}
    </div>
  );
};

export default SessionRings;
