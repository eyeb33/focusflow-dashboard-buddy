
import React, { useEffect, useState } from 'react';
import TimerHeader from './TimerHeader';
import TimerDisplay from './TimerDisplay';
import TimerObserver from './TimerObserver';
import { SessionStartModal } from './SessionStartModal';
import { SessionReflectionModal } from './SessionReflectionModal';
import { useTimerContext } from '@/contexts/TimerContext';
import { useTheme } from "@/components/Theme/ThemeProvider";
import { useTimerAudio } from '@/hooks/useTimerAudio';
import { Task } from '@/types/task';

interface TimerContainerProps {
  activeTask: Task | null;
}

const TimerContainer: React.FC<TimerContainerProps> = ({ 
  activeTask,
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
  
  // Handle start with chime
  const handleStartWithChime = () => {
    playStartChime();
    handleStart();
  };
  
  // Handle reflection submission
  const handleReflectionSubmit = async (quality: 'completed' | 'progress' | 'distracted', reflection: string) => {
    await saveSessionReflection(quality, reflection);
    setShowReflectionModal(false);
    setCompletedSessionData(null);
  };

  return (
    <TimerObserver>
      <div 
        className="flex flex-col items-center justify-start w-full"
        data-testid="timer-container"
      >
        <TimerHeader 
          timerMode={timerMode}
          handleModeChange={handleModeChange}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onReset={handleReset}
          timerType={settings.timerType}
          onTimerTypeChange={(type) => updateSettings({ timerType: type })}
        />

        <TimerDisplay 
          timerMode={timerMode}
          timeRemaining={timeRemaining}
          totalSeconds={getTotalSeconds()}
          theme={theme}
          isRunning={isRunning}
          isFreeStudy={settings.timerType === 'freeStudy'}
          onStart={handleStartWithChime}
          onPause={handlePause}
          onReset={handleReset}
          showControls={true}
          totalSessions={settings?.sessionsUntilLongBreak || 4}
          currentSessionIndex={currentSessionIndex}
        />

        {/* Show active topic name below timer if one is selected */}
        {activeTask && (
          <div className="mt-4 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-center">
              <span className="text-muted-foreground">Tracking: </span>
              <span className="font-medium text-primary">{activeTask.name}</span>
            </p>
          </div>
        )}
      </div>
      
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
