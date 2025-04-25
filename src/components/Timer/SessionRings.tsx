
import React, { useEffect, useState } from 'react';
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
  // State for pulsing animation
  const [isPulsing, setIsPulsing] = useState(false);

  // Enable pulsing animation for the last 10 seconds
  useEffect(() => {
    const checkRemainingTime = () => {
      const timer = window.timerContext?.timeRemaining;
      if (timer !== undefined && timer <= 10) {
        setIsPulsing(true);
      } else {
        setIsPulsing(false);
      }
    };
    const intervalId = setInterval(checkRemainingTime, 500);
    return () => clearInterval(intervalId);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('SessionRings rendering with:', {
      mode,
      completedSessions,
      totalSessions,
      currentPosition
    });
  }, [mode, completedSessions, totalSessions, currentPosition]);

  /**
   * "Focus" (work) mode: show only red rings
   * - totalSessions red rings
   * - filled if completed
   * - active (currentPosition) ring is larger
   */
  const renderWorkRings = () => {
    const elements = [];
    for (let i = 0; i < totalSessions; i++) {
      // A session is filled if:
      // 1. It's completed (index < completedSessions)
      // 2. It is NOT the current session in progress (i !== currentPosition)
      const isFilled = i < completedSessions && i !== currentPosition;
      
      // The active session is the current one in progress
      const isActive = i === currentPosition;
      
      elements.push(
        <div
          key={`work-${i}`}
          className={cn(
            "rounded-full transition-colors duration-300 flex-shrink-0",
            isActive ? "w-5 h-5" : "w-4 h-4",
            isPulsing && isActive ? "animate-pulse-slow" : "",
            isFilled ? "bg-red-500" : "border-2 border-red-500"
          )}
        ></div>
      );
    }
    return (
      <div className="flex justify-center items-center gap-2">
        {elements}
      </div>
    );
  };

  /**
   * "Break" mode: show only green rings
   * - (totalSessions - 1) green rings, one after each work except the last
   * - filled if break before this taken
   */
  const renderBreakRings = () => {
    const numBreaks = totalSessions - 1;
    const elements = [];
    
    // Determine active break index
    // For break mode, we need to show the rings differently
    // The active break is the one currently in progress
    // Default to -1 if no active position (for initial display)
    const activeIdx = currentPosition !== undefined ? currentPosition : -1;
    
    for (let i = 0; i < numBreaks; i++) {
      // A break is filled if:
      // 1. It's completed (i < completedSessions - 1)
      // 2. It is NOT the current break in progress (i !== activeIdx)
      const isFilled = i < completedSessions && i !== activeIdx;
      const isActive = i === activeIdx;
      
      elements.push(
        <div
          key={`break-${i}`}
          className={cn(
            "rounded-full transition-colors duration-300 flex-shrink-0",
            isActive ? "w-5 h-5" : "w-4 h-4",
            isPulsing && isActive ? "animate-pulse-slow" : "",
            isFilled ? "bg-green-500" : "border-2 border-green-500"
          )}
        ></div>
      );
    }
    return (
      <div className="flex justify-center items-center gap-2">
        {elements}
      </div>
    );
  };

  /**
   * "Long Break" mode: show just a large blue ring
   */
  const renderLongBreakRing = () => (
    <div className="flex justify-center items-center gap-2">
      <div
        className={cn(
          "rounded-full flex-shrink-0 border-2 border-blue-500 flex items-center justify-center",
          isPulsing ? "animate-pulse-slow" : "",
          "w-8 h-8"
        )}
      ></div>
    </div>
  );

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {mode === "work" && renderWorkRings()}
      {mode === "break" && renderBreakRings()}
      {mode === "longBreak" && renderLongBreakRing()}
    </div>
  );
};

export default SessionRings;
