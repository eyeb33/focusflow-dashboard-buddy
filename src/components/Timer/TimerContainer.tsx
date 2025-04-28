"use client";

import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CircularProgress from "./CircularProgress";
import TimerControls from "./TimerControls";
import TimerSettings from "./TimerSettings";
import SessionRings from "./SessionRings";
import { useTimerControls } from "@/hooks/useTimerControls";
import { useTimerSettings } from "@/hooks/useTimerSettings";
import { cn } from "@/lib/utils";

const TimerContainer = () => {
  const {
    isRunning,
    timerMode,
    timeRemaining,
    progress,
    currentSessionIndex,
    formatTime,
    start,
    pause,
    reset,
    changeMode,
    getModeLabel,
  } = useTimerControls();

  const { settings } = useTimerSettings();

  const modeColors = {
    work: {
      startPauseColor: "bg-red-500",
      resetColor: "text-red-500",
      activeClass:
        "data-[state=active]:bg-red-500 data-[state=active]:text-white",
    },
    break: {
      startPauseColor: "bg-green-500",
      resetColor: "text-green-500",
      activeClass:
        "data-[state=active]:bg-green-500 data-[state=active]:text-white",
    },
    longBreak: {
      startPauseColor: "bg-blue-500",
      resetColor: "text-blue-500",
      activeClass:
        "data-[state=active]:bg-blue-500 data-[state=active]:text-white",
    },
  };

  const currentModeColors = modeColors[timerMode];

  useEffect(() => {
    console.log(
      `Mode: ${timerMode} | Session: ${currentSessionIndex} | Time Left: ${timeRemaining}s`
    );
  }, [timerMode, currentSessionIndex, timeRemaining]);

  return (
    <Card className="w-full max-w-md p-6 bg-white dark:bg-black backdrop-blur-sm shadow-md">
      <div className="flex items-center justify-between mb-6">
        <Tabs
          value={timerMode}
          onValueChange={(v) => changeMode(v as "work" | "break" | "longBreak")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            {["work", "break", "longBreak"].map((mode) => (
              <TabsTrigger
                key={mode}
                value={mode}
                className={cn(currentModeColors.activeClass)}
              >
                {mode === "work"
                  ? "Focus"
                  : mode === "break"
                  ? "Break"
                  : "Long Break"}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <TimerSettings className="ml-2.5" />
      </div>

      <div className="flex flex-col items-center">
        <Badge variant="outline" className="mb-4">
          {getModeLabel()}
        </Badge>

        <CircularProgress
          progress={progress}
          mode={timerMode}
          size={260}
          className="mb-6"
        >
          <div className="text-center">
            <div className="text-5xl font-bold tracking-tighter font-mono w-[180px] flex justify-center">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {timerMode === "work" ? "Focus on your task" : "Take a break"}
            </div>
          </div>
        </CircularProgress>

        <TimerControls
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={reset}
          mode={timerMode}
          className="mb-4"
        />

        <SessionRings
          completedSessions={currentSessionIndex}
          totalSessions={settings.sessionsUntilLongBreak}
          mode={timerMode}
          currentPosition={currentSessionIndex}
          className="mt-2"
        />
      </div>
    </Card>
  );
};

export default TimerContainer;
