
import React from 'react';
import { cn } from "@/lib/utils";

interface TimerModeTabsProps {
  currentMode: 'focus' | 'break' | 'longBreak';
  onModeChange: (mode: 'focus' | 'break' | 'longBreak') => void;
}

const TimerModeTabs: React.FC<TimerModeTabsProps> = ({
  currentMode,
  onModeChange
}) => {
  return (
    <div className="w-full mb-2">
      <div className="flex bg-[#1e293b] rounded-md p-1">
        <button 
          onClick={() => onModeChange('focus')} 
          className={cn(
            "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
            currentMode === 'focus' ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Focus
        </button>
        <button 
          onClick={() => onModeChange('break')} 
          className={cn(
            "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
            currentMode === 'break' ? "bg-green-500 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Break
        </button>
        <button 
          onClick={() => onModeChange('longBreak')} 
          className={cn(
            "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
            currentMode === 'longBreak' ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Long Break
        </button>
      </div>
    </div>
  );
};

export default TimerModeTabs;
