import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CircularProgress from "@/components/Timer/CircularProgress";
import TimerControls from "@/components/Timer/TimerControls";
import TimerSettings from "@/components/Timer/TimerSettings";
import SessionInfo from "@/components/Timer/SessionInfo";
import { useTimerControls } from "@/hooks/useTimerControls";
import { useTimerStats } from "@/hooks/useTimerStats";
import { useTimerSettings } from "@/hooks/useTimerSettings";
import { cn } from "@/lib/utils";

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
    totalTimeToday,
    sessionsUntilLongBreak
  } = useTimerStats();
  
  const { settings } = useTimerSettings();

  const modeColors = {
    work: {
      startPauseColor: "bg-red-500",
      resetColor: "text-red-500",
      activeClass: "data-[state=active]:bg-red-500 data-[state=active]:text-white"
    },
    break: {
      startPauseColor: "bg-green-500",
      resetColor: "text-green-500",
      activeClass: "data-[state=active]:bg-green-500 data-[state=active]:text-white"
    },
    longBreak: {
      startPauseColor: "bg-blue-500",
      resetColor: "text-blue-500",
      activeClass: "data-[state=active]:bg-blue-500 data-[state=active]:text-white"
    }
  };

  const currentModeColors = modeColors[timerMode];

  return (
    <Card className="w-full max-w-md p-6 bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-md">
      <div className="flex items-center justify-between mb-6">
        <Tabs 
          value={timerMode} 
          onValueChange={(v) => changeMode(v as 'work' | 'break' | 'longBreak')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="work"
              className={cn(
                currentModeColors.activeClass
              )}
            >
              Focus
            </TabsTrigger>
            <TabsTrigger 
              value="break"
              className={cn(
                currentModeColors.activeClass
              )}
            >
              Break
            </TabsTrigger>
            <TabsTrigger 
              value="longBreak"
              className={cn(
                currentModeColors.activeClass
              )}
            >
              Long Break
            </TabsTrigger>
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
          mode={timerMode}
          className="mb-2"
        />
      </div>
      
      <SessionInfo 
        completedSessions={completedSessions}
        totalTimeToday={totalTimeToday}
        sessionsUntilLongBreak={sessionsUntilLongBreak}
      />
    </Card>
  );
};

export default TimerContainer;
