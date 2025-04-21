
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
  // Use the explicitly passed position or calculate from completed sessions
  const positionInCycle = currentPosition !== undefined ? 
    currentPosition : (completedSessions % totalSessions);
  
  // State for pulsing animation
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Enable pulsing animation for the last 10 seconds
  useEffect(() => {
    // Check if there's a timer in the global context
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
  }, [mode]);
  
  // Render work session circles (only shown in work mode)
  const renderWorkCircles = () => {
    if (mode !== 'work') return null;
    
    const circles = [];
    
    for (let i = 0; i < totalSessions; i++) {
      // Is this position active or completed?
      const isActive = positionInCycle === i;
      const isCompleted = i < positionInCycle;
      
      // Size the active indicator larger
      const size = isActive ? 'w-4 h-4' : 'w-3 h-3';
      
      circles.push(
        <div
          key={`work-${i}`}
          className={cn(
            "rounded-full transition-colors duration-300 flex-shrink-0",
            size,
            isActive && isPulsing ? "animate-pulse-light" : "",
            isActive ? "border-2 border-red-500 flex items-center justify-center" : "",
            isCompleted ? "bg-red-500" : "border-2 border-red-500"
          )}
        />
      );
    }
    
    return (
      <div className="flex justify-center items-center gap-2">
        {circles}
      </div>
    );
  };
  
  // Render break session circles (only shown in break mode)
  const renderBreakCircles = () => {
    if (mode !== 'break') return null;
    
    const circles = [];
    
    for (let i = 0; i < totalSessions - 1; i++) { // One less because last is long break
      const isActive = positionInCycle === i;
      const isCompleted = i < positionInCycle;
      
      const size = isActive ? 'w-4 h-4' : 'w-3 h-3';
      
      circles.push(
        <div
          key={`break-${i}`}
          className={cn(
            "rounded-full transition-colors duration-300 flex-shrink-0",
            size,
            isActive && isPulsing ? "animate-pulse-light" : "",
            isActive ? "border-2 border-green-500 flex items-center justify-center" : "",
            isCompleted ? "bg-green-500" : "border-2 border-green-500"
          )}
        />
      );
    }
    
    return (
      <div className="flex justify-center items-center gap-2">
        {circles}
      </div>
    );
  };
  
  // Render long break circle (only shown in longBreak mode)
  const renderLongBreakCircle = () => {
    if (mode !== 'longBreak') return null;
    
    return (
      <div className="flex justify-center items-center">
        <div
          className={cn(
            "rounded-full transition-colors duration-300",
            isPulsing ? "w-5 h-5 animate-pulse-light" : "w-4 h-4",
            "border-2 border-blue-500 flex items-center justify-center"
          )}
        />
      </div>
    );
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {renderWorkCircles()}
      {renderBreakCircles()}
      {renderLongBreakCircle()}
    </div>
  );
};

export default SessionRings;
