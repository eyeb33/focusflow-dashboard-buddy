"use client";

import { cn } from "@/lib/utils";

interface CircularProgressProps {
  progress: number;
  mode: "work" | "break" | "longBreak";
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
  className?: string;
}

const modeColors = {
  work: "stroke-red-500",
  break: "stroke-green-500",
  longBreak: "stroke-blue-500",
};

export default function CircularProgress({
  progress,
  mode,
  size = 240,
  thickness = 8,
  children,
  className,
}: CircularProgressProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div
      className={cn(
        "relative",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-300 dark:text-gray-700"
          stroke="currentColor"
          strokeWidth={thickness}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("transition-all duration-300 ease-out", modeColors[mode])}
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
