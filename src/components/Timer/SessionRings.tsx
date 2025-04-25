
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
  currentPosition = 0
}) => {
  // State for pulsing animation
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('SessionRings rendering with:', {
      mode,
      completedSessions,
      totalSessions,
      currentPosition
    });
  }, [mode, completedSessions, totalSessions, currentPosition]);

  // Enable pulsing animation for the last 10 seconds
  useEffect(() => {
    const checkRemainingTime = () => {
      const timer = window.timerContext?.timeRemaining;
      if (timer !== undefined && timer <= 10 && timer > 0) {
        setIsPulsing(true);
      } else {
        setIsPulsing(false);
      }
    };
    
    const intervalId = setInterval(checkRemainingTime, 500);
    return () => clearInterval(intervalId);
  }, []);

  /**
   * "Focus" (work) mode: show red rings
   * - totalSessions red rings
   * - filled ONLY if position < completedSessions (strictly less than)
   * - active (currentPosition) ring is larger
   */
  const renderWorkRings = () => {
    const elements = [];
    for (let i = 0; i < totalSessions; i++) {
      // A session is filled ONLY if its position is LESS than completedSessions
      // This ensures we don't fill the current session until it's completed
      const isFilled = i < completedSessions;
      
      // The active session is the current one in progress
      const isActive = i === currentPosition;
      
      elements.push(
        <div
          key={`work-${i}`}
          className={cn(
            "rounded-full transition-all duration-300 flex-shrink-0",
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
   * "Break" mode: show green rings
   * - (totalSessions - 1) green rings for short breaks
   * - filled ONLY if position < completedSessions (strictly less than)
   */
  const renderBreakRings = () => {
    // Number of breaks is always one less than total sessions
    const numBreaks = totalSessions - 1;
    const elements = [];
    
    for (let i = 0; i < numBreaks; i++) {
      // A break is filled ONLY if its position is LESS than completedSessions
      // This ensures we don't fill the current break until it's completed
      const isFilled = i < completedSessions;
      
      // The active break is the current one in progress
      const isActive = i === currentPosition;
      
      elements.push(
        <div
          key={`break-${i}`}
          className={cn(
            "rounded-full transition-all duration-300 flex-shrink-0",
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
