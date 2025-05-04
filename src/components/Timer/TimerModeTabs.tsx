
import React from 'react';
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/Theme/ThemeProvider";

interface TimerModeTabsProps {
  currentMode: 'focus' | 'break' | 'longBreak';
  onModeChange: (mode: 'focus' | 'break' | 'longBreak') => void;
}

const TimerModeTabs: React.FC<TimerModeTabsProps> = ({
  currentMode,
  onModeChange
}) => {
  const { theme } = useTheme();
  
  return (
    <div className="w-full mb-2">
      <div className={cn(
        "flex rounded-md p-1",
        theme === "dark" 
          ? "bg-[#1e293b]" 
          : "bg-gray-200"  // Lighter background for light mode
      )}>
        <button 
          onClick={() => onModeChange('focus')} 
          className={cn(
            "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
            currentMode === 'focus' 
              ? "bg-red-500 text-white" 
              : theme === "dark" 
                ? "text-gray-400 hover:text-white" 
                : "text-gray-600 hover:text-gray-800" // Darker text for better contrast in light mode
          )}
        >
          Focus
        </button>
        <button 
          onClick={() => onModeChange('break')} 
          className={cn(
            "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
            currentMode === 'break' 
              ? "bg-green-500 text-white" 
              : theme === "dark" 
                ? "text-gray-400 hover:text-white" 
                : "text-gray-600 hover:text-gray-800" // Darker text for better contrast in light mode
          )}
        >
          Break
        </button>
        <button 
          onClick={() => onModeChange('longBreak')} 
          className={cn(
            "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
            currentMode === 'longBreak' 
              ? "bg-blue-500 text-white" 
              : theme === "dark" 
                ? "text-gray-400 hover:text-white" 
                : "text-gray-600 hover:text-gray-800" // Darker text for better contrast in light mode
          )}
        >
          Long Break
        </button>
      </div>
    </div>
  );
};

export default TimerModeTabs;
