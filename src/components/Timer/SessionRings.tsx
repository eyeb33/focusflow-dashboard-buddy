
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

  /**
   * "Focus" (work) mode: show only red rings
   * - totalSessions red rings
   * - filled if completed
   * - active (currentPosition) ring is larger
   */
  const renderWorkRings = () => {
    const elements = [];
    for (let i = 0; i < totalSessions; i++) {
      const isFilled = i < completedSessions;
      const isActive = i === (currentPosition ?? completedSessions);
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
   * - active is currentPosition-1
   */
  const renderBreakRings = () => {
    const numBreaks = totalSessions - 1;
    const elements = [];
    // The current break is at currentPosition-1, except when starting, then it's 0
    // fallback if currentPosition undefined: use completedSessions-1 but not below 0
    const activeIdx = (currentPosition !== undefined ? currentPosition - 1 : Math.max(completedSessions - 1, 0));
    for (let i = 0; i < numBreaks; i++) {
      const isFilled = i < completedSessions - 1;
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
