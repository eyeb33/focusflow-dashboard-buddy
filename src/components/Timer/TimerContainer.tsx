
import React, { useEffect } from 'react';
import TimerHeader from './TimerHeader';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import TimerObserver from './TimerObserver';
import ActiveTaskZone from '../Tasks/ActiveTaskZone';
import { useTimerContext } from '@/contexts/TimerContext';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { Task } from '@/types/task';

interface TimerContainerProps {
  activeTask: Task | null;
  onRemoveActiveTask: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const TimerContainer: React.FC<TimerContainerProps> = ({
  activeTask,
  onRemoveActiveTask,
  onDrop,
  onDragOver
}) => {
  const {
    timerMode,
    isRunning,
    timeRemaining,
    settings,
    completedSessions,
    currentSessionIndex,
    progress,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    updateSettings
  } = useTimerContext();
  
  const { theme } = useTheme();
  
  // Calculate total seconds for the current mode
  const getTotalSeconds = () => {
    if (!settings) return 0;
    
    switch(timerMode) {
      case 'work': return settings.workDuration * 60;
      case 'break': return settings.breakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  };
  
  // Handle settings updates
  const handleSettingsChange = (newDurations: any) => {
    updateSettings(newDurations);
  };

  const getBackgroundColor = () => {
    if (theme === 'dark') return '';
    
    switch(timerMode) {
      case 'work': return 'bg-[hsl(var(--timer-focus-bg))]';
      case 'break': return 'bg-[hsl(var(--timer-break-bg))]';
      case 'longBreak': return 'bg-[hsl(var(--timer-longbreak-bg))]';
      default: return 'bg-[hsl(var(--timer-focus-bg))]';
    }
  };

  return (
    <TimerObserver>
      <div 
        className="flex-1 flex flex-col items-center relative overflow-hidden transition-colors duration-500"
        data-testid="timer-container"
      >
        <TimerHeader 
          timerMode={timerMode}
          handleModeChange={handleModeChange}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onReset={handleReset}
        />

        <TimerDisplay 
          timerMode={timerMode}
          timeRemaining={timeRemaining}
          totalSeconds={getTotalSeconds()}
          theme={theme}
        />

        <TimerControls 
          isRunning={isRunning}
          mode={timerMode}
          onStart={handleStart}
          onPause={handlePause}
          onReset={handleReset}
        />
        <SessionDots 
          totalSessions={settings?.sessionsUntilLongBreak || 4} 
          currentSessionIndex={currentSessionIndex}
          mode={timerMode}
        />

        <ActiveTaskZone
          activeTask={activeTask}
          onRemoveTask={onRemoveActiveTask}
          onDrop={onDrop}
          onDragOver={onDragOver}
        />
      </div>
    </TimerObserver>
  );
};

export default TimerContainer;
