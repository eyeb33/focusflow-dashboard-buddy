
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/Theme/ThemeProvider";

interface CircularProgressProps {
  progress: number; // Value between 0 and 100
  mode: "work" | "break" | "longBreak";
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

const modeColors = {
  work: "#ef4343", // Red
  break: "#2fc55e", // Green
  longBreak: "#3b81f6", // Blue
};

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  mode,
  size = 240,
  className,
  children,
}) => {
  // Add loading state to prevent flashing on initial render
  const [isLoaded, setIsLoaded] = useState(false);
  
  // After component mount, mark as loaded to enable animations
  useEffect(() => {
    // Small delay to ensure smooth initial render
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the dash offset based on progress (0-100)
  const safeProgress = Math.max(0, Math.min(100, progress));
  const offset = circumference * (1 - safeProgress / 100);
  
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
          stroke={theme === "dark" ? "#444" : "#e5e7eb"}
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
          strokeDashoffset={isLoaded ? offset : circumference} // Start with full offset (empty) if not loaded
          strokeLinecap="round"
          style={{ transition: isLoaded ? "stroke-dashoffset 0.3s ease" : "none" }} // Only animate after loaded
          transform={`rotate(-90 ${size/2} ${size/2})`} // Start from the top
        />
      </svg>
      <div className="relative z-10 flex items-center justify-center w-full font-mono">
        {children}
      </div>
    </div>
  );
};

export default CircularProgress;
