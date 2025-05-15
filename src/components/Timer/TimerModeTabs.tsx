
import React from 'react';
import { cn } from "@/lib/utils";
import { TimerMode } from '@/utils/timerContextUtils';

// Updated interface to use proper TimerMode type
interface TimerModeTabsProps {
  currentMode: TimerMode;  // Changed from 'mode' to 'currentMode' to match TimerHeader usage
  onModeChange: (mode: TimerMode) => void;
}

const TimerModeTabs: React.FC<TimerModeTabsProps> = ({ 
  currentMode, // Updated prop name to match what's passed in TimerHeader
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
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1 mb-4">
      {(['work', 'break', 'longBreak'] as TimerMode[]).map((tabMode) => (
        <button
          key={tabMode}
          onClick={() => onModeChange(tabMode)}
          className={cn(
            "flex-1 py-1 px-3 text-sm rounded transition-colors",
            currentMode === tabMode 
              ? tabMode === 'work' 
                ? "bg-red-500 text-white" 
                : tabMode === 'break' 
                  ? "bg-green-500 text-white" 
                  : "bg-blue-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          {getModeLabel(tabMode)}
        </button>
      ))}
    </div>
  );
};

export default TimerModeTabs;
