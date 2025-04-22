
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
  // Calculate the number of breaks between works: (totalSessions - 1)
  const numberOfBreaks = totalSessions - 1;

  // Calculate the full cycle: work + break + work + ... + longBreak
  const cycleLength = totalSessions + numberOfBreaks + 1;

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

  // Render all circles representing the sequence (works, breaks, longBreak)
  const renderCycle = () => {
    const elements = [];
    let workDone = completedSessions;
    let activeIndex = 0;

    // Calculate the "absolute" active index in the entire cycle
    if (mode === 'work') {
      // Where are we in the works? Highlight the first incomplete work (0-based)
      activeIndex = currentPosition !== undefined ? currentPosition * 2 : workDone * 2;
    } else if (mode === 'break') {
      // In break, highlight the break that comes *after* the last completed work.
      // If currentPosition is defined, that's the index of the last completed work, so break follows at 2*i + 1
      activeIndex = currentPosition !== undefined ? (currentPosition * 2) - 1 + 1 : (workDone * 2) - 1 + 1;
      if (activeIndex < 1) activeIndex = 1; // Must be at least the first break
    } else if (mode === 'longBreak') {
      // Long break is always the last circle
      activeIndex = cycleLength - 1;
    }

    // Paint the sequence:
    // W B W B W B ... W LB  (LB = long break)
    let pos = 0;
    for (let i = 0; i < totalSessions + numberOfBreaks + 1; i++) {
      let isWork = false;
      let isBreak = false;
      let isLongBreak = false;
      // Sequence positions: even indices = work, odd = break, last = long break
      if (i % 2 === 0 && i < totalSessions * 2 - 1) isWork = true;
      if (i % 2 === 1 && i < totalSessions * 2 - 2) isBreak = true;
      if (i === totalSessions * 2 - 1) isLongBreak = true;

      // Classes and logic for filling
      let baseClasses = "rounded-full transition-colors duration-300 flex-shrink-0";
      let size = 'w-3 h-3';
      let filled = false;
      let color = '';
      let extra = '';

      if (isWork) {
        // How many completed work sessions? Fill if less than completed
        let workIdx = Math.floor(i / 2);
        filled = workIdx < completedSessions;
        // If "work" mode & this is the current, make it large + pulsing
        let isActive = mode === "work" && i === activeIndex;
        if (isActive) {
          size = 'w-4 h-4';
          extra = isPulsing ? "animate-pulse" : "";
        }
        color = filled ? "bg-red-500" : "border-2 border-red-500";
        if (!filled && isActive) color += " border-2 border-red-500 flex items-center justify-center";
        elements.push(
          <div
            key={`work-${workIdx}`}
            className={cn(baseClasses, size, extra, color)}
          ></div>
        );
      } else if (isBreak) {
        // How many breaks completed? Fill if break before this was taken
        let breakIdx = Math.floor((i - 1) / 2);
        // A break is "filled" only if its corresponding completedSession > breakIdx
        filled = breakIdx < completedSessions - 1;
        let isActive = mode === "break" && i === activeIndex;
        if (isActive) {
          size = 'w-4 h-4';
          extra = isPulsing ? "animate-pulse" : "";
        }
        color = filled ? "bg-green-500" : "border-2 border-green-500";
        if (!filled && isActive) color += " border-2 border-green-500 flex items-center justify-center";
        elements.push(
          <div
            key={`break-${breakIdx}`}
            className={cn(baseClasses, size, extra, color)}
          ></div>
        );
      } else if (isLongBreak) {
        // Long break indicator
        let isActive = mode === "longBreak" && i === activeIndex;
        size = isActive ? (isPulsing ? "w-5 h-5 animate-pulse" : "w-4 h-4") : "w-4 h-4";
        color = "border-2 border-blue-500 flex items-center justify-center";
        elements.push(
          <div
            key="long-break"
            className={cn(baseClasses, size, color)}
          ></div>
        );
      }
    }

    return (
      <div className="flex justify-center items-center gap-2">
        {elements}
      </div>
    );
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {renderCycle()}
    </div>
  );
};

export default SessionRings;
