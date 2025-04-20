
import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsDisplayProps {
  label: string;
  value: number;
  diff: number | null;
  isLoading: boolean;
  positiveColor: string;
  negativeColor: string;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({
  label,
  value,
  diff,
  isLoading,
  positiveColor,
  negativeColor,
}) => (
  <div>
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
    {!isLoading && diff !== null && (
      <div className="flex items-center justify-center mt-1 text-xs">
        <span
          className={cn(
            "flex items-center",
            diff > 0
              ? positiveColor
              : diff < 0
              ? negativeColor
              : "text-muted-foreground"
          )}
        >
          {diff > 0 ? (
            <ArrowUp className="h-3 w-3 mr-0.5" />
          ) : diff < 0 ? (
            <ArrowDown className="h-3 w-3 mr-0.5" />
          ) : (
            <Minus className="h-3 w-3 mr-0.5" />
          )}
          {Math.abs(diff)}%
        </span>
      </div>
    )}
  </div>
);

export default StatsDisplay;
