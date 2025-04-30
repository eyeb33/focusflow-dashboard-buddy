
import React, { useEffect, useRef, useState } from "react";
import TimerCircle from "./TimerCircle";
import TimerSettings from "./TimerSettings";
import { Button } from "@/components/ui/button";
import { Pause, Play, RotateCw } from "lucide-react";

const PomodoroTimer = () => {
  const defaultDurations = {
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
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
    if (mode === "focus") {
      const newSessionCount = completedFocusSessions + 1;
      setCompletedFocusSessions(newSessionCount);
      if (newSessionCount % durations.sessionsBeforeLongBreak === 0) {
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
    setSecondsLeft(durations[mode] * 60);
  };

  const handleDurationChange = (newDurations: typeof durations) => {
    setDurations(newDurations);
  };

  return (
    <div className="p-4 rounded-lg border border-border w-full bg-background">
      {/* Mode Selection */}
      <div className="flex justify-between mb-4">
        {["focus", "break", "longBreak"].map((label) => (
          <button
            key={label}
            onClick={() => {
              setMode(label as any);
              resetTimer();
            }}
            className={`px-4 py-2 rounded ${
              mode === label ? "bg-red-600 text-white" : "bg-muted"
            }`}
          >
            {label === "focus"
              ? "Focus"
              : label === "break"
              ? "Break"
              : "Long Break"}
          </button>
        ))}
        <TimerSettings durations={durations} onChange={handleDurationChange} />
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center gap-2">
        <TimerCircle secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
        <p className="text-xl font-medium mt-2">
          {mode === "focus"
            ? "Focus on your task"
            : mode === "break"
            ? "Take a break"
            : "Take a long break"}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mt-4">
        <Button
          onClick={toggleTimer}
          className={`rounded-full p-6 ${
            mode === "focus" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} />}
        </Button>
        <Button onClick={resetTimer} variant="ghost">
          <RotateCw size={24} />
        </Button>
      </div>

      {/* Session Dots */}
      <div className="flex justify-center gap-2 mt-2">
        {Array.from({ length: durations.sessionsBeforeLongBreak }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i < completedFocusSessions % durations.sessionsBeforeLongBreak
                ? "bg-red-500"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PomodoroTimer;
