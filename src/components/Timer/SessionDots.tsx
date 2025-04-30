
import React from 'react';

interface SessionDotsProps {
  totalSessions: number;
  currentSessionIndex: number;
}

const SessionDots: React.FC<SessionDotsProps> = ({
  totalSessions,
  currentSessionIndex
}) => {
  console.log(`SessionDots render: totalSessions=${totalSessions}, currentIndex=${currentSessionIndex}`);
  
  return (
    <div className="flex justify-center space-x-1.5 mb-2">
      {Array.from({ length: totalSessions }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i < currentSessionIndex 
              ? "bg-red-500 w-2 h-2" // Completed sessions
              : i === currentSessionIndex 
                ? "bg-red-500 w-3 h-3" // Active session (larger and red)
                : "bg-gray-600 w-2 h-2" // Future sessions
          }`}
        />
      ))}
    </div>
  );
};

export default SessionDots;
