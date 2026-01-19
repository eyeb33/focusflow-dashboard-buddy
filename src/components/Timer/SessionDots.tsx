
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
  
  // Determine how many dots to display based on mode
  let dotsConfig = {
    count: totalSessions,  // Default for work sessions
    activeDotIndex: currentSessionIndex
  };
  
  if (mode === 'break') {
    // For regular breaks: show totalSessions - 1 dots (one less than focus sessions)
    dotsConfig = {
      count: totalSessions - 1,
      activeDotIndex: currentSessionIndex
    };
  } else if (mode === 'longBreak') {
    // For long break: show only 1 dot (the long break itself)
    dotsConfig = {
      count: 1, 
      activeDotIndex: 0  // Always highlight this single dot
    };
  }
  
  // Generate array of session dots
  const dots = Array.from({ length: dotsConfig.count }, (_, i) => i);

  // Get color for dots based on the current mode
  const getDotColors = () => {
    switch(mode) {
      case 'break':
        return {
          active: "#738f66", // Green
          completed: "#738f66",
          inactive: theme === "dark" ? "#444" : "#d1d5db"
        };
      case 'longBreak':
        return {
          active: "#a4c2b6", // Blue
          completed: "#a4c2b6",
          inactive: theme === "dark" ? "#444" : "#d1d5db"
        };
      case 'work':
      default:
        return {
          active: "#df1515", // Red
          completed: "#df1515",
          inactive: theme === "dark" ? "#444" : "#d1d5db"
        };
    }
  };

  const colors = getDotColors();

  return (
    <div className="flex justify-center items-center mt-0 mb-2 space-x-2">
      {dots.map((dotIndex) => {
        let isActive = false;
        let isComplete = false;
        
        if (mode === 'work') {
          // For work mode: current dot is active, previous dots are completed
          isActive = dotIndex === currentSessionIndex;
          isComplete = dotIndex < currentSessionIndex;
        } else if (mode === 'break') {
          // For regular breaks: only highlight the current break dot (which corresponds to currentSessionIndex)
          // During breaks, the currentSessionIndex is the index of the NEXT work session
          isActive = dotIndex === currentSessionIndex - 1; // The break dot that corresponds to the previous work session
          isComplete = dotIndex < currentSessionIndex - 1;
        } else if (mode === 'longBreak') {
          // For long break: the single dot is always active
          isActive = true;
          isComplete = false;
        }
        
        return (
          <div
            key={dotIndex}
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
