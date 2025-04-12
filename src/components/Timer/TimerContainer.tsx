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
