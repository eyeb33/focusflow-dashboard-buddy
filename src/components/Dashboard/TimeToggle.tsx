
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
    <div className={cn("flex p-1 gap-1 bg-muted rounded-lg w-fit", className)}>
      <button
        onClick={() => onChange('yesterday')}
        className={cn(
          "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
          selectedPeriod === 'yesterday' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        Yesterday
      </button>
      <button
        onClick={() => onChange('today')}
        className={cn(
          "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
          selectedPeriod === 'today' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        Today
      </button>
      <button
        onClick={() => onChange('week')}
        className={cn(
          "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
          selectedPeriod === 'week' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        This Week
      </button>
      <button
        onClick={() => onChange('month')}
        className={cn(
          "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
          selectedPeriod === 'month' ? "bg-background shadow-sm" : "hover:bg-background/50"
        )}
      >
        This Month
      </button>
    </div>
  );
};

export default TimeToggle;
