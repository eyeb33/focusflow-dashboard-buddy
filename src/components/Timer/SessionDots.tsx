
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

  // Get color for dots based on the current mode
  const getDotColors = () => {
    switch(mode) {
      case 'break':
      case 'longBreak':
        return {
          active: "#2fc55e", // Green for break modes
          completed: "#2fc55e",
          inactive: theme === "dark" ? "#444" : "#d1d5db"
        };
      case 'work':
      default:
        return {
          active: "#ff4545", // Red for work mode
          completed: "#ff4545",
          inactive: theme === "dark" ? "#444" : "#d1d5db"
        };
    }
  };

  const colors = getDotColors();

  return (
    <div className="flex justify-center items-center mt-1 space-x-2">
      {sessions.map((sessionIndex) => {
        let isActive = false;
        let isComplete = false;
        
        if (mode === 'work') {
          // For work mode: current dot is active, previous dots are completed
          isActive = currentSessionIndex === sessionIndex;
          isComplete = sessionIndex < currentSessionIndex;
        } else if (mode === 'break' || mode === 'longBreak') {
          // For break modes: highlight the same dot as the most recently completed work session
          // In the pomodoro flow, the first break should highlight the first dot,
          // the second break should highlight the second dot, and so on
          if (mode === 'break') {
            // For regular breaks, active dot is the current session index
            isActive = currentSessionIndex === sessionIndex;
          } else {
            // For long breaks, activate the first dot of the next cycle
            isActive = sessionIndex === 0;
          }
          // Completed dots are those before the active one
          isComplete = sessionIndex < currentSessionIndex;
        }
        
        return (
          <div
            key={sessionIndex}
            className={cn(
              "rounded-full transition-all duration-300",
              isActive 
                ? "w-3 h-3" 
                : "w-2 h-2"
            )}
            style={{
              backgroundColor: isActive 
                ? colors.active
                : isComplete 
                  ? colors.completed
                  : colors.inactive
            }}
          />
        );
      })}
    </div>
  );
};

export default SessionDots;
