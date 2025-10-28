
import React, { useEffect, useState } from 'react';
import TimerHeader from './TimerHeader';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import TimerObserver from './TimerObserver';
import ActiveTaskZone from '../Tasks/ActiveTaskZone';
import { SessionStartModal } from './SessionStartModal';
import { SessionReflectionModal } from './SessionReflectionModal';
import { useTimerContext } from '@/contexts/TimerContext';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { useTimerAudio } from '@/hooks/useTimerAudio';
import { cn } from "@/lib/utils";
import { Task } from '@/types/task';

interface TimerContainerProps {
  activeTask: Task | null;
  tasks: Task[];
  onRemoveActiveTask: () => void;
  onCompleteActiveTask: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onQuickAddTask: (taskName: string) => Promise<string | null>;
  onSetActiveTask: (taskId: string) => Promise<void>;
}

const TimerContainer: React.FC<TimerContainerProps> = ({ 
  activeTask,
  tasks,
  onRemoveActiveTask,
  onCompleteActiveTask,
  onDrop,
  onDragOver,
  onQuickAddTask,
  onSetActiveTask
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
    updateSettings,
    sessionGoal,
    setSessionGoal,
    saveSessionReflection,
    setOnSessionComplete
  } = useTimerContext();
  
  const { theme } = useTheme();
  const { playStartChime } = useTimerAudio();
  
  // Modal states
  const [showStartModal, setShowStartModal] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{
    taskName?: string;
    sessionGoal?: string;
    durationMinutes: number;
  } | null>(null);
  
  // Register session complete callback
  useEffect(() => {
    setOnSessionComplete((sessionData) => {
      if (sessionData.mode === 'work') {
        const taskName = activeTask?.name;
        setCompletedSessionData({
          taskName,
          sessionGoal: sessionGoal || undefined,
          durationMinutes: Math.floor(sessionData.duration / 60)
        });
        setShowReflectionModal(true);
      }
    });
  }, [setOnSessionComplete, activeTask, sessionGoal]);
  
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
  
  // Handle start with modal check
  const handleStartWithModal = () => {
    if (timerMode === 'work' && !activeTask && !isRunning) {
      setShowStartModal(true);
    } else {
      playStartChime();
      handleStart();
    }
  };
  
  // Handle session start from modal
  const handleSessionStart = async (taskId: string | null, goal: string) => {
    if (taskId && taskId !== activeTask?.id) {
      await onSetActiveTask(taskId);
    }
    setSessionGoal(goal);
    playStartChime();
    handleStart(goal);
  };
  
  // Handle reflection submission
  const handleReflectionSubmit = async (quality: 'completed' | 'progress' | 'distracted', reflection: string) => {
    await saveSessionReflection(quality, reflection);
    setShowReflectionModal(false);
    setCompletedSessionData(null);
  };

  // Get background gradient based on mode and theme
  const getBackgroundStyle = () => {
    const baseClasses = "min-h-screen transition-all duration-700 ease-in-out";
    
    if (theme === 'dark') {
      return 'bg-background';
    }
    
    // Light mode - vibrant zone-specific gradients
    switch (timerMode) {
      case 'work':
        return 'bg-gradient-to-br from-[hsl(350,70%,85%)] via-[hsl(350,65%,82%)] to-[hsl(350,70%,80%)]';
      case 'break':
        return 'bg-gradient-to-br from-[hsl(130,40%,75%)] via-[hsl(130,38%,72%)] to-[hsl(130,40%,70%)]';
      case 'longBreak':
        return 'bg-gradient-to-br from-[hsl(210,50%,75%)] via-[hsl(210,48%,72%)] to-[hsl(210,50%,70%)]';
      default:
        return 'bg-gradient-to-br from-[hsl(350,70%,85%)] via-[hsl(350,65%,82%)] to-[hsl(350,70%,80%)]';
    }
  };

  return (
    <TimerObserver>
      <div 
        className={cn(
          "flex-1 flex flex-col items-center relative overflow-hidden transition-all duration-700 ease-in-out px-8 py-12",
          getBackgroundStyle()
        )}
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
          onStart={handleStartWithModal}
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
          onCompleteTask={onCompleteActiveTask}
          onDrop={onDrop}
          onDragOver={onDragOver}
          sessionGoal={sessionGoal}
          timeRemaining={timeRemaining}
          totalTime={getTotalSeconds()}
          isRunning={isRunning}
        />
      </div>
      
      {/* Session Start Modal */}
      <SessionStartModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStart={handleSessionStart}
        tasks={tasks}
        activeTask={activeTask}
        onQuickAddTask={onQuickAddTask}
      />
      
      {/* Session Reflection Modal */}
      {completedSessionData && (
        <SessionReflectionModal
          open={showReflectionModal}
          onClose={() => {
            setShowReflectionModal(false);
            setCompletedSessionData(null);
          }}
          onSubmit={handleReflectionSubmit}
          sessionGoal={completedSessionData.sessionGoal}
          taskName={completedSessionData.taskName}
          durationMinutes={completedSessionData.durationMinutes}
        />
      )}
    </TimerObserver>
  );
};

export default TimerContainer;
