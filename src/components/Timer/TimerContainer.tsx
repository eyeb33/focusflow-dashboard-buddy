
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CircularProgress from "@/components/Timer/CircularProgress";
import TimerControls from "@/components/Timer/TimerControls";
import TimerSettings from "@/components/Timer/TimerSettings";
import SessionInfo from "@/components/Timer/SessionInfo";
import { useTimer } from "@/hooks/useTimer";

const TimerContainer: React.FC = () => {
  const {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    totalTimeToday,
    settings,
    progress,
    formatTime,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    handleModeChange,
    getModeLabel,
    updateSettings
  } = useTimer({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  });

  return (
    <Card className="w-full max-w-md p-6 bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-md">
      <div className="flex items-center justify-between mb-6">
        <Tabs 
          value={timerMode} 
          onValueChange={(v) => handleModeChange(v as 'work' | 'break' | 'longBreak')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="work">Focus</TabsTrigger>
            <TabsTrigger value="break">Break</TabsTrigger>
            <TabsTrigger value="longBreak">Long Break</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <TimerSettings
          workDuration={settings.workDuration}
          breakDuration={settings.breakDuration}
          longBreakDuration={settings.longBreakDuration}
          sessionsUntilLongBreak={settings.sessionsUntilLongBreak}
          onWorkDurationChange={(value) => updateSettings({ workDuration: value })}
          onBreakDurationChange={(value) => updateSettings({ breakDuration: value })}
          onLongBreakDurationChange={(value) => updateSettings({ longBreakDuration: value })}
          onSessionsUntilLongBreakChange={(value) => updateSettings({ sessionsUntilLongBreak: value })}
        />
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
            <div className="text-5xl font-bold tracking-tighter">
              {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {timerMode === 'work' ? "Focus on your task" : "Take a break"}
            </div>
          </div>
        </CircularProgress>
        
        <TimerControls
          isRunning={isRunning}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
          onSkip={handleSkip}
          className="mb-2"
        />
      </div>
      
      <SessionInfo 
        completedSessions={completedSessions}
        totalTimeToday={totalTimeToday}
        sessionsUntilLongBreak={settings.sessionsUntilLongBreak}
      />
    </Card>
  );
};

export default TimerContainer;
