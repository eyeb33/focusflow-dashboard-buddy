import React from "react";
import { cn } from "@/lib/utils";

interface SessionRingsProps {
  completedSessions: number;
  totalSessions: number;
  mode: "work" | "break" | "longBreak";
  currentPosition: number;
  className?: string;
}

const modeColors = {
  work: "#ef4343",
  break: "#2fc55e",
  longBreak: "#3b81f6",
};

const SessionRings: React.FC<SessionRingsProps> = ({
  completedSessions,
  totalSessions,
  mode,
  currentPosition,
  className,
}) => {
  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length: totalSessions }).map((_, index) => {
        const isCompleted = index < completedSessions;
        const isCurrent = index === currentPosition;

        return (
          <div
            key={index}
            className={cn(
              "w-3 h-3 rounded-full border-2",
              isCompleted
                ? "opacity-100"
                : "opacity-30 border-muted",
              isCurrent && !isCompleted
                ? "animate-pulse"
                : "",
            )}
            style={{
              borderColor: isCompleted || isCurrent
                ? modeColors[mode]
                : "#d1d5db",
              backgroundColor: isCompleted ? modeColors[mode] : "transparent",
            }}
          />
        );
      })}
    </div>
  );
};

export default SessionRings;
