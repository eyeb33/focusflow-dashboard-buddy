import React from "react";
import { cn } from "@/lib/utils";

interface TimerCircleProps {
  progress: number; // 0 to 1
  children?: React.ReactNode;
  className?: string;
  color?: string;
}

const TimerCircle: React.FC<TimerCircleProps> = ({
  progress,
  children,
  className,
  color = "#ef4343",
}) => {
  const radius = 100;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className={cn("relative w-[220px] h-[220px]", className)}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + " " + circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default TimerCircle;
