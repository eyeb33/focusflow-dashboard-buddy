
import React from 'react';
import { Circle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTheme } from '@/components/Theme/ThemeProvider';

interface SessionDotsProps {
  totalSessions: number;
  currentSessionIndex: number;
  mode?: 'work' | 'break' | 'longBreak';
  className?: string;
}

const SessionDots: React.FC<SessionDotsProps> = ({
  totalSessions,
  currentSessionIndex,
  mode = 'work',
  className
}) => {
  const { theme } = useTheme();
  
  // Get colors based on timer mode
  const getColor = (mode: string): { fill: string, stroke: string } => {
    switch (mode) {
      case 'work':
        return { fill: 'text-red-500', stroke: theme === "dark" ? 'text-red-200' : 'text-red-300' };
      case 'break':
        return { fill: 'text-green-500', stroke: theme === "dark" ? 'text-green-200' : 'text-green-300' };
      case 'longBreak':
        return { fill: 'text-blue-500', stroke: theme === "dark" ? 'text-blue-200' : 'text-blue-300' };
      default:
        return { fill: 'text-gray-500', stroke: theme === "dark" ? 'text-gray-200' : 'text-gray-300' };
    }
  };

  const colors = getColor(mode);
  
  const renderDots = () => {
    if (mode === 'longBreak') {
      // For long break, show a single blue circle
      return (
        <Circle
          key="longbreak-circle"
          size={24}
          className={cn("text-transparent stroke-[2.5px]", colors.fill)}
          fill="none"
        />
      );
    }
    
    if (mode === 'break') {
      // For break mode, show all break circles (total - 1 since we have totalSessions work sessions)
      // and highlight the current break
      const totalBreaks = totalSessions - 1;
      
      return Array.from({ length: totalBreaks }).map((_, i) => {
        // Critical fix: We need to adjust how we determine the active break
        // In break mode, currentSessionIndex represents the NEXT work session, not the current break
        // So the active break index should be currentSessionIndex - 1 (since breaks come after work sessions)
        // If we're on the first break (after first focus session), currentSessionIndex will be 1
        // But we want to highlight the first break circle (index 0)
        const isActive = i === (currentSessionIndex === 0 ? 0 : currentSessionIndex - 1);
        
        // Size the active indicator slightly larger
        const size = isActive ? 24 : 18;
        
        return (
          <Circle
            key={`break-${i}`}
            size={size}
            className={cn(
              'transition-all duration-300 text-transparent',
              isActive ? 'stroke-[2.5px]' : 'stroke-[2px]',
              isActive ? colors.fill : colors.stroke
            )}
            fill="none"
          />
        );
      });
    }
    
    // For work mode, show dots based on the total sessions and current position
    return Array.from({ length: totalSessions }).map((_, i) => {
      // A session is filled if its position is less than currentSessionIndex
      const isFilled = i < currentSessionIndex;
      
      // Is this the active position?
      const isActive = i === currentSessionIndex;
      
      // Size the active indicator slightly larger
      const size = isActive ? 24 : 18;
      
      return (
        <Circle
          key={`${mode}-${i}`}
          size={size}
          className={cn(
            'transition-all duration-300',
            isFilled ? colors.fill : 'text-transparent',
            isActive ? 'stroke-[2.5px]' : 'stroke-[2px]',
            isActive ? colors.fill : colors.stroke
          )}
          fill={isFilled ? "currentColor" : "none"}
        />
      );
    });
  };

  return (
    <div className={cn("flex justify-center space-x-2 mb-2", className)}>
      {renderDots()}
    </div>
  );
};

export default SessionDots;
