
import React, { useEffect } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import TimerModeTabs from './TimerModeTabs';
import TimerControls from './TimerControls';
import SessionDots from './SessionDots';
import { useTimer } from '@/hooks/useTimer';

const TimerContainer = () => {
  const {
    timerMode,
    isRunning,
    timeRemaining,
    completedSessions,
    currentSessionIndex,
    progress,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange
  } = useTimer();

  // Map timerMode to the format expected by TimerCircle
  const getTimerCircleMode = () => {
    switch(timerMode) {
      case 'work': return 'focus';
      case 'break': return 'break';
      case 'longBreak': return 'longBreak';
      default: return 'focus';
    }
  };

  // Calculate total seconds for the current mode
  const getTotalSeconds = () => {
    if (!timeRemaining) return 0;
    return timeRemaining;
  };

  return (
    <div className="h-[450px] bg-black text-white rounded-lg p-4 flex flex-col items-center">
      <TimerModeTabs 
        currentMode={timerMode === 'work' ? 'focus' : timerMode} 
        onModeChange={(newMode) => {
          // Convert focus back to work for compatibility
          const mappedMode = newMode === 'focus' ? 'work' : newMode;
          handleModeChange(mappedMode);
        }} 
      />

      <div className="relative flex flex-col items-center justify-center mt-2">
        <div className="text-center mb-2">
          <div className="text-xs rounded-full bg-black px-3 py-0.5 inline-block">
            {timerMode === 'work' ? 'Focus' : timerMode === 'break' ? 'Break' : 'Long Break'}
          </div>
        </div>
        
        <TimerCircle
          secondsLeft={timeRemaining}
          totalSeconds={getTotalSeconds()}
          mode={getTimerCircleMode()}
        />
      </div>

      <TimerControls 
        isRunning={isRunning}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />
      
      <SessionDots 
        totalSessions={4} // Default to 4 sessions
        currentSessionIndex={currentSessionIndex}
      />
    </div>
  );
};

export default TimerContainer;
