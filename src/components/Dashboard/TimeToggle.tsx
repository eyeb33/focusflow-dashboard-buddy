
import React from 'react';
import { cn } from "@/lib/utils";

export type TimePeriod = 'yesterday' | 'today' | 'week' | 'month';

interface TimeToggleProps {
  selectedPeriod: TimePeriod;
  onChange: (period: TimePeriod) => void;
  className?: string;
}

const TimeToggle: React.FC<TimeToggleProps> = ({ selectedPeriod, onChange, className }) => {
  return (
    <div className={cn(
      "flex p-1 gap-1 bg-muted rounded-lg w-fit max-w-full overflow-x-auto scrollbar-hide",
      className
    )}>
      <button
        onClick={() => onChange('yesterday')}
        className={cn(
          "min-h-[44px] px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
          "touch-manipulation active:scale-95",
          selectedPeriod === 'yesterday' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        Yesterday
      </button>
      <button
        onClick={() => onChange('today')}
        className={cn(
          "min-h-[44px] px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
          "touch-manipulation active:scale-95",
          selectedPeriod === 'today' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        Today
      </button>
      <button
        onClick={() => onChange('week')}
        className={cn(
          "min-h-[44px] px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
          "touch-manipulation active:scale-95",
          selectedPeriod === 'week' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        This Week
      </button>
      <button
        onClick={() => onChange('month')}
        className={cn(
          "min-h-[44px] px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0",
          "touch-manipulation active:scale-95",
          selectedPeriod === 'month' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        This Month
      </button>
    </div>
  );
};

export default TimeToggle;
