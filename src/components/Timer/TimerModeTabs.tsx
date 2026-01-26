
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
    <div className="inline-flex items-center rounded-lg bg-muted p-1">
      {(['work', 'break', 'longBreak'] as TimerMode[]).map((tabMode) => {
        const bgVar = tabMode === 'work' ? '--timer-focus-bg' : tabMode === 'break' ? '--timer-break-bg' : '--timer-longbreak-bg';
        return (
          <button
            key={tabMode}
            onClick={() => onModeChange(tabMode)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
              currentMode === tabMode 
                ? "text-white shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            style={currentMode === tabMode ? { backgroundColor: `hsl(var(${bgVar}))` } : undefined}
          >
            {getModeLabel(tabMode)}
          </button>
        );
      })}
    </div>
  );
};

export default TimerModeTabs;
