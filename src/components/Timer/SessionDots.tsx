
import React from 'react';
import { Circle } from 'lucide-react';
import { cn } from "@/lib/utils";

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
  // Get colors based on timer mode
  const getColor = (mode: string): { fill: string, stroke: string } => {
    switch (mode) {
      case 'work':
        return { fill: 'text-red-500', stroke: 'text-red-200' };
      case 'break':
        return { fill: 'text-green-500', stroke: 'text-green-200' };
      case 'longBreak':
        return { fill: 'text-blue-500', stroke: 'text-blue-200' };
      default:
        return { fill: 'text-gray-500', stroke: 'text-gray-200' };
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
          className="text-transparent stroke-[2.5px] text-blue-500"
          fill="none"
        />
      );
    }
    
    if (mode === 'work') {
      // For work sessions (red circles)
      return Array.from({ length: totalSessions }).map((_, i) => {
        // A session is filled if its position is less than currentSessionIndex
        const isFilled = i < currentSessionIndex;
        
        // Is this the active position?
        const isActive = i === currentSessionIndex;
        
        // Size the active indicator slightly larger
        const size = isActive ? 24 : 18;
        
        return (
          <Circle
            key={`work-${i}`}
            size={size}
            className={cn(
              isFilled ? colors.fill : 'text-transparent',
              isActive ? 'stroke-[2.5px]' : 'stroke-[2px]',
              isActive ? colors.fill : colors.stroke,
              'transition-all duration-300'
            )}
            fill={isFilled ? "currentColor" : "none"}
          />
        );
      });
    } else if (mode === 'break') {
      // For break sessions (green circles)
      return Array.from({ length: totalSessions }).map((_, i) => {
        // A break is filled if position is less than currentSessionIndex
        const isFilled = i < currentSessionIndex;
        
        // Is this the active position?
        const isActive = i === currentSessionIndex;
        
        // Size the active indicator slightly larger
        const size = isActive ? 24 : 18;
        
        return (
          <Circle
            key={`break-${i}`}
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
    }
    
    return null;
  };

  return (
    <div className={cn("flex justify-center space-x-2 mb-2", className)}>
      {renderDots()}
    </div>
  );
};

export default SessionDots;
