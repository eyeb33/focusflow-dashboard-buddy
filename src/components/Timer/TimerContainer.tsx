
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CircularProgress from "@/components/Timer/CircularProgress";
import TimerControls from "@/components/Timer/TimerControls";
import TimerSettings from "@/components/Timer/TimerSettings";
import SessionRings from "@/components/Timer/SessionRings";
import { useTimerSettings } from "@/hooks/useTimerSettings";
import { cn } from "@/lib/utils";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const TimerContainer: React.FC = () => {
  const { settings } = useTimerSettings();
  
  const {
    timeLeft,
    isRunning,
    mode,
    progress,
    currentSessionIndex,
    start,
    pause,
    reset,
    handleModeChange,
    formatTime,
    getModeLabel
  } = usePomodoroTimer(settings);
  
  useDocumentTitle({
    timeRemaining: timeLeft,
    timerMode: mode,
    isRunning,
    formatTime,
    settings
  });

  // Make window.timerContext available for SessionRings animation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.timerContext = {
        timeRemaining: timeLeft,
        isRunning
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.timerContext;
      }
    };
  }, [timeLeft, isRunning]);

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

  const currentModeColors = modeColors[mode];
  
  return (
    <Card className="w-full max-w-md p-6 bg-white dark:bg-black backdrop-blur-sm shadow-md">
      <div className="flex items-center justify-between mb-6">
        <Tabs 
          value={mode} 
          onValueChange={(v) => handleModeChange(v as 'work' | 'break' | 'longBreak')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="work"
              className={cn(currentModeColors.activeClass)}
            >
              Focus
            </TabsTrigger>
            <TabsTrigger 
              value="break"
              className={cn(currentModeColors.activeClass)}
            >
              Break
            </TabsTrigger>
            <TabsTrigger 
              value="longBreak"
              className={cn(currentModeColors.activeClass)}
            >
              Long Break
            </TabsTrigger>
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
          mode={mode}
          size={260}
          className="mb-6"
        >
          <div className="text-center">
            <div className="text-5xl font-bold tracking-tighter font-mono w-[180px] flex justify-center">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {mode === 'work' ? "Focus on your task" : "Take a break"}
            </div>
          </div>
        </CircularProgress>
        
        <TimerControls
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={reset}
          mode={mode}
          className="mb-4"
        />
        
        <SessionRings
          completedSessions={currentSessionIndex}
          totalSessions={settings.sessionsUntilLongBreak}
          mode={mode}
          currentPosition={currentSessionIndex % settings.sessionsUntilLongBreak}
          className="mt-2"
        />
      </div>
    </Card>
  );
};

export default TimerContainer;
