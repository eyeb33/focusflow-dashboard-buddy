
import React, { useEffect, useRef, useState } from "react";
import TimerCircle from "./TimerCircle";
import TimerSettings from "./TimerSettings";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const PomodoroTimer = () => {
  const defaultDurations = {
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  };

  const [mode, setMode] = useState<"focus" | "break" | "longBreak">("focus");
  const [durations, setDurations] = useState(defaultDurations);
  const [secondsLeft, setSecondsLeft] = useState(durations.focus * 60);
  const [totalSeconds, setTotalSeconds] = useState(durations.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer when mode or durations change
  useEffect(() => {
    const newTotalSeconds = durations[mode] * 60;
    setTotalSeconds(newTotalSeconds);
    
    // Only reset secondsLeft if timer is not running
    if (!isRunning) {
      setSecondsLeft(newTotalSeconds);
    }
  }, [mode, durations, isRunning]);

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleTimerEnd = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (mode === "focus") {
      const newSessionCount = completedFocusSessions + 1;
      setCompletedFocusSessions(newSessionCount);
      if (newSessionCount % durations.sessionsUntilLongBreak === 0) {
        setMode("longBreak");
      } else {
        setMode("break");
      }
    } else {
      setMode("focus");
    }
  };

  const toggleTimer = () => {
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSecondsLeft(durations[mode] * 60);
  };

  const handleDurationChange = (newDurations: typeof durations) => {
    setDurations(newDurations);
  };

  return (
    <div className="p-4 rounded-lg border border-border w-full bg-black text-white">
      {/* Mode Selection */}
      <div className="flex mb-4 bg-[#1e293b] rounded-md p-1">
        {["focus", "break", "longBreak"].map((label) => (
          <button
            key={label}
            onClick={() => {
              setMode(label as any);
              if (isRunning) {
                setIsRunning(false);
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
              }
              setSecondsLeft(durations[label as keyof typeof durations] * 60);
            }}
            className={cn(
              "flex-1 py-2 rounded-sm text-center transition-colors",
              mode === label 
                ? (label === "focus" ? "bg-red-500 text-white" : 
                   label === "break" ? "bg-green-500 text-white" : 
                   "bg-blue-500 text-white")
                : "text-gray-400 hover:text-white"
            )}
          >
            {label === "focus"
              ? "Focus"
              : label === "break"
              ? "Break"
              : "Long Break"}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center">
        <div className="text-center mb-2">
          <div className="text-sm rounded-full bg-black px-4 py-1 inline-block">
            {mode === "focus" ? "Focus" : mode === "break" ? "Break" : "Long Break"}
          </div>
        </div>
        
        <TimerCircle secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-6 mt-10 mb-6">
        <button
          onClick={toggleTimer}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
        >
          {isRunning ? (
            <Pause className="h-6 w-6 text-red-500" />
          ) : (
            <Play className="h-6 w-6 text-red-500 ml-1" />
          )}
        </button>
        
        <button 
          onClick={resetTimer}
          className="w-16 h-16 rounded-full bg-white flex items-center justify-center"
        >
          <RotateCcw className="h-6 w-6 text-red-500" />
        </button>
      </div>

      {/* Session Dots */}
      <div className="flex justify-center space-x-2">
        {Array.from({ length: durations.sessionsUntilLongBreak }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full ${
              i < completedFocusSessions % durations.sessionsUntilLongBreak
                ? "bg-red-500"
                : "bg-gray-600"
            }`}
          />
        ))}
      </div>
      
      {/* Settings button */}
      <div className="absolute top-4 right-4">
        <TimerSettings durations={durations} onChange={handleDurationChange} />
      </div>
    </div>
  );
};

export default PomodoroTimer;
