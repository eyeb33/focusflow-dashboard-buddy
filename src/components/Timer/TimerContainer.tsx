
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CircularProgress from "@/components/Timer/CircularProgress";
import TimerControls from "@/components/Timer/TimerControls";
import TimerSettings from "@/components/Timer/TimerSettings";
import { useTimerControls } from "@/hooks/useTimerControls";
import { useTimerStats } from "@/hooks/useTimerStats";
import { useTimerSettings } from "@/hooks/useTimerSettings";
import { Check, Circle } from "lucide-react";

const TimerContainer: React.FC = () => {
  const {
    isRunning,
    timerMode,
    timeRemaining,
    progress,
    formatTime,
    start,
    pause,
    reset,
    changeMode,
    getModeLabel
  } = useTimerControls();
  
  const {
    completedSessions,
    sessionsUntilLongBreak
  } = useTimerStats();
  
  const { settings } = useTimerSettings();
  
  // Calculate which pomodoro in the cycle we're on
  const currentCyclePosition = completedSessions % sessionsUntilLongBreak;
  
  // Create an array to represent the pomodoro cycle
  const cycleIndicators = Array(sessionsUntilLongBreak).fill(0).map((_, index) => {
    if (index < currentCyclePosition) {
      return <Check key={index} className="h-4 w-4 text-green-500" />;
    } else if (index === currentCyclePosition && timerMode === 'work') {
      return <Circle key={index} className="h-4 w-4 text-red-500 animate-pulse" />;
    } else {
      return <Circle key={index} className="h-4 w-4 text-muted-foreground" />;
    }
  });

  return (
    <Card className="w-full max-w-md p-6 bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-md">
      <div className="flex items-center justify-between mb-6">
        <Tabs 
          value={timerMode} 
          onValueChange={(v) => changeMode(v as 'work' | 'break' | 'longBreak')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="work">Focus</TabsTrigger>
            <TabsTrigger value="break">Break</TabsTrigger>
            <TabsTrigger value="longBreak">Long Break</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <TimerSettings />
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
              {timerMode === 'work' ? "Focus on your task" : "Take a break"}
            </div>
          </div>
        </CircularProgress>
        
        <TimerControls
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={reset}
          className="mb-4"
        />
        
        {/* Pomodoro cycle indicator */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {cycleIndicators}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {currentCyclePosition}/{sessionsUntilLongBreak} in this cycle
        </div>
      </div>
    </Card>
  );
};

export default TimerContainer;
