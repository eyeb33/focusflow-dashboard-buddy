
import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/Theme/ThemeProvider";

interface CircularProgressProps {
  progress: number; // Value between 0 and 1
  mode: "work" | "break" | "longBreak";
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

const modeColors = {
  work: "#ef4343",
  break: "#2fc55e",
  longBreak: "#3b81f6",
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  mode,
  size = 240,
  className,
  children,
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  const { theme } = useTheme();

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute top-0 left-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme === "dark" ? "#444" : "#e5e7eb"} // Theme-aware background
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={modeColors[mode]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
