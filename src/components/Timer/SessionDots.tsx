
import React from 'react';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";

interface SessionDotsProps {
  totalSessions: number;
  currentSessionIndex: number;
  mode: 'work' | 'break' | 'longBreak';
}

const SessionDots: React.FC<SessionDotsProps> = ({ 
  totalSessions, 
  currentSessionIndex,
  mode 
}) => {
  const { theme } = useTheme();
  
  // Generate array of session numbers
  const sessions = Array.from({ length: totalSessions }, (_, i) => i);

  // Get color for completed dots based on theme
  const getCompletedDotColor = () => {
    return theme === "dark" ? "#ff4545" : "#e74c3c";
  };

  // Get color for inactive dots based on theme
  const getInactiveDotColor = () => {
    return theme === "dark" ? "#444" : "#d1d5db";
  };

  return (
    <div className="flex justify-center items-center mt-1 space-x-2">
      {sessions.map((sessionIndex) => {
        // Current working session
        const isCurrentWork = currentSessionIndex === sessionIndex && mode === 'work';
        
        // Break that comes after the previous work session
        const isCurrentBreak = currentSessionIndex - 1 === sessionIndex && 
                              (mode === 'break' || mode === 'longBreak');
        
        // Completed sessions are those before the current work session
        const isCompleted = sessionIndex < currentSessionIndex && mode === 'work';
        
        // For break mode, the completed sessions are those strictly before the session before current
        const isCompletedDuringBreak = sessionIndex < currentSessionIndex - 1 && 
                                      (mode === 'break' || mode === 'longBreak');
        
        const isActive = isCurrentWork || isCurrentBreak;
        const isComplete = mode === 'work' ? isCompleted : isCompletedDuringBreak;
        
        return (
          <div
            key={sessionIndex}
            className={cn(
              "rounded-full transition-all duration-300",
              isActive 
                ? "w-3 h-3 bg-red-500" 
                : isComplete 
                  ? `w-2 h-2`
                  : "w-2 h-2"
            )}
            style={{
              backgroundColor: isActive 
                ? "#ff4545" 
                : isComplete 
                  ? getCompletedDotColor()
                  : getInactiveDotColor()
            }}
          />
        );
      })}
    </div>
  );
};

export default SessionDots;
