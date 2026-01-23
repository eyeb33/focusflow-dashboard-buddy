
import React from "react";
import { cn } from "@/lib/utils";
import { useSessionCalculations, type TimerMode } from "@/hooks/useTimerCalculations";

interface SessionRingsProps {
  completedSessions: number;
  totalSessions: number;
  mode: "work" | "break" | "longBreak";
  currentPosition: number;
  className?: string;
}

const SessionRings: React.FC<SessionRingsProps> = ({
  completedSessions,
  totalSessions,
  mode,
  currentPosition,
  className,
}) => {
  // Use shared session calculations
  const { sessionDots, colors } = useSessionCalculations({
    completedSessions,
    totalSessions,
    currentSessionIndex: currentPosition,
    mode: mode as TimerMode,
  });

  return (
    <div className={cn("flex gap-2", className)}>
      {sessionDots.map(({ index, isCompleted, isCurrent }) => (
        <div
          key={index}
          className={cn(
            "w-3 h-3 rounded-full border-2",
            isCompleted ? "opacity-100" : "opacity-30 border-muted",
            isCurrent && !isCompleted ? "animate-pulse" : "",
          )}
          style={{
            borderColor: isCompleted || isCurrent ? colors.hex : "#d1d5db",
            backgroundColor: isCompleted ? colors.hex : "transparent",
          }}
        />
      ))}
    </div>
  );
};

export default SessionRings;
