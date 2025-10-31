
import React from 'react';
import { cn } from "@/lib/utils";
import { TimerMode } from '@/utils/timerContextUtils';

// Updated interface to use proper TimerMode type
interface TimerModeTabsProps {
  currentMode: TimerMode;  // This prop name needs to match what's passed in TimerHeader
  onModeChange: (mode: TimerMode) => void;
}

const TimerModeTabs: React.FC<TimerModeTabsProps> = ({ 
  currentMode, 
  onModeChange 
}) => {
  // Map internal mode values to user-friendly labels
  const getModeLabel = (mode: TimerMode) => {
    switch(mode) {
      case 'work': return 'Focus';
      case 'break': return 'Break';
      case 'longBreak': return 'Long Break';
      default: return 'Focus';
    }
  };

  return (
    <div className="flex bg-muted rounded-lg p-1 mb-6 w-full shadow-soft">
      {(['work', 'break', 'longBreak'] as TimerMode[]).map((tabMode) => (
        <button
          key={tabMode}
          onClick={() => onModeChange(tabMode)}
          className={cn(
            "flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap",
            currentMode === tabMode 
              ? tabMode === 'work' 
                ? "bg-[#df1515] text-white shadow-soft" 
                : tabMode === 'break' 
                  ? "bg-[#738f66] text-white shadow-soft" 
                  : "bg-[#70cccb] text-white shadow-soft"
              : "text-muted-foreground hover:text-foreground hover:bg-accent font-medium"
          )}
        >
          {getModeLabel(tabMode)}
        </button>
      ))}
    </div>
  );
};

export default TimerModeTabs;
