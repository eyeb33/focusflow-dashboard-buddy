
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
    let timerCheckInterval: NodeJS.Timeout | null = null;
    
    // Check if window.timerContext exists before using it
    const checkRemainingTime = () => {
      if (typeof window !== 'undefined' && window.timerContext && window.timerContext.timeRemaining !== undefined) {
        const timer = window.timerContext.timeRemaining;
        if (timer <= 10 && timer > 0) {
          setIsPulsing(true);
        } else {
          setIsPulsing(false);
        }
      }
    };
    
    timerCheckInterval = setInterval(checkRemainingTime, 500);
    return () => {
      if (timerCheckInterval) {
        clearInterval(timerCheckInterval);
      }
    };
  }, []);

  /**
   * "Focus" (work) mode: show red rings
   * - Each ring represents a work session
   * - A ring is filled if its corresponding session is completed
   * - The current active session ring is larger
   */
  const renderWorkRings = () => {
    const elements = [];
    for (let i = 0; i < totalSessions; i++) {
      // A session is filled if it's been completed (i < completedSessions)
      const isFilled = i < completedSessions;
      
      // The active session is the current one in progress (i === currentPosition)
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
   * - Each ring represents a break (one fewer than total work sessions)
   * - A break ring is filled if its corresponding break is completed 
   * - The current active break ring is larger
   */
  const renderBreakRings = () => {
    // There's one fewer break than total sessions
    const numBreaks = totalSessions - 1;
    const elements = [];
    
    for (let i = 0; i < numBreaks; i++) {
      // A break is filled if the next work session has been completed
      // This logic means we show filled circles for completed breaks
      const isFilled = i < completedSessions - 1;
      
      // The active position is the current break we're on
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
