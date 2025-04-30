
import React from 'react';

interface SessionDotsProps {
  totalSessions: number;
  currentSessionIndex: number;
}

const SessionDots: React.FC<SessionDotsProps> = ({
  totalSessions,
  currentSessionIndex
}) => {
  return (
    <div className="flex justify-center space-x-2 mb-2">
      {Array.from({ length: totalSessions }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full border-2 transition-all ${
            i === currentSessionIndex
              ? "border-red-500 w-4 h-4" // Active session (larger and red border)
              : i < currentSessionIndex
                ? "border-red-500 w-3 h-3" // Completed sessions (red border)
                : "border-gray-600 w-3 h-3" // Future sessions (gray border)
          }`}
        />
      ))}
    </div>
  );
};

export default SessionDots;
