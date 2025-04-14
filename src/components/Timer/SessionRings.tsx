
import React from 'react';
import { cn } from '@/lib/utils';

interface SessionRingsProps {
  completedSessions: number;
  totalSessions: number;
  mode: "work" | "break";
  className?: string;
}

const SessionRings: React.FC<SessionRingsProps> = ({
  completedSessions,
  totalSessions,
  mode,
  className
}) => {
  const activeColor = mode === "work" ? "bg-red-500" : "bg-green-500";

  return (
    <div className={cn("flex justify-center gap-2", className)}>
      {[...Array(totalSessions)].map((_, index) => (
        <div
          key={index}
          className={cn(
            "w-3 h-3 rounded-full transition-colors duration-300",
            index < completedSessions ? activeColor : "bg-muted"
          )}
        />
      ))}
    </div>
  );
};

export default SessionRings;
