
// TimerContainer.tsx
import React, { useState, useEffect } from 'react';
import TimerCircle from './TimerCircle';
import TimerSettings from './TimerSettings';
import { cn } from "@/lib/utils";
import { Pause, Play, RotateCcw } from "lucide-react";

const TimerContainer = () => {
  const [settings, setSettings] = useState({
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });

  const [mode, setMode] = useState<'focus' | 'break' | 'longBreak'>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(settings.focus * 60);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);

  // Handle timer tick
  useEffect(() => {
    if (isRunning) {
      const interval = window.setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime <= 1) {
            // Timer complete - handle session completion
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      // Store interval ID so we can clear it later
      setTimerInterval(interval as unknown as number);
      
      return () => clearInterval(interval);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isRunning, mode]);

  // Update timer when mode or settings change (but only if not running)
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'focus') {
        setRemainingTime(settings.focus * 60);
      } else if (mode === 'break') {
        setRemainingTime(settings.break * 60);
      } else {
        setRemainingTime(settings.longBreak * 60);
      }
    }
  }, [mode, settings, isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    // Handle session transition
    if (mode === 'focus') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Check if it's time for a long break
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setMode('longBreak');
      } else {
        setMode('break');
      }
    } else {
      // After any break, return to focus mode
      setMode('focus');
    }
  };

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    if (mode === 'focus') {
      setRemainingTime(settings.focus * 60);
    } else if (mode === 'break') {
      setRemainingTime(settings.break * 60);
    } else {
      setRemainingTime(settings.longBreak * 60);
    }
  };

  const changeMode = (newMode: 'focus' | 'break' | 'longBreak') => {
    setMode(newMode);
    pauseTimer();
    if (newMode === 'focus') {
      setRemainingTime(settings.focus * 60);
    } else if (newMode === 'break') {
      setRemainingTime(settings.break * 60);
    } else {
      setRemainingTime(settings.longBreak * 60);
    }
  };

  const updateSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    if (!isRunning) {
      if (mode === 'focus') {
        setRemainingTime(newSettings.focus * 60);
      } else if (mode === 'break') {
        setRemainingTime(newSettings.break * 60);
      } else {
        setRemainingTime(newSettings.longBreak * 60);
      }
    }
  };

  // Calculate session dots based on completed sessions
  const currentSessionIndex = completedSessions % settings.sessionsUntilLongBreak;

  return (
    <div className="h-[450px] bg-black text-white rounded-lg p-4 flex flex-col items-center">
      <div className="w-full mb-2">
        <div className="flex bg-[#1e293b] rounded-md p-1">
          <button 
            onClick={() => changeMode('focus')} 
            className={cn(
              "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
              mode === 'focus' ? "bg-red-500 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            Focus
          </button>
          <button 
            onClick={() => changeMode('break')} 
            className={cn(
              "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
              mode === 'break' ? "bg-green-500 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            Break
          </button>
          <button 
            onClick={() => changeMode('longBreak')} 
            className={cn(
              "flex-1 py-1.5 text-sm rounded-sm text-center transition-colors",
              mode === 'longBreak' ? "bg-blue-500 text-white" : "text-gray-400 hover:text-white"
            )}
          >
            Long Break
          </button>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center mt-2">
        <div className="text-center mb-2">
          <div className="text-xs rounded-full bg-black px-3 py-0.5 inline-block">
            {mode === 'focus' ? 'Focus' : mode === 'break' ? 'Break' : 'Long Break'}
          </div>
        </div>
        
        <TimerCircle
          secondsLeft={remainingTime}
          totalSeconds={mode === 'focus' 
            ? settings.focus * 60 
            : mode === 'break' 
              ? settings.break * 60 
              : settings.longBreak * 60
          }
        />
      </div>

      <div className="flex gap-5 mt-6 mb-4">
        <button 
          onClick={isRunning ? pauseTimer : startTimer}
          className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center"
        >
          {isRunning ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white ml-1" />
          )}
        </button>
        
        <button 
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center"
        >
          <RotateCcw className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Session progress dots - update styling for active and completed */}
      <div className="flex justify-center space-x-1.5 mb-2">
        {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full ${
              i < currentSessionIndex 
                ? "bg-red-500 w-2 h-2" // Completed sessions
                : i === currentSessionIndex 
                  ? "bg-gray-600 w-3 h-3" // Active session (larger)
                  : "bg-gray-600 w-2 h-2" // Future sessions
            }`}
          />
        ))}
      </div>

      {/* Settings button in the top right */}
      <div className="absolute top-4 right-4">
        <TimerSettings durations={settings} onChange={updateSettings} />
      </div>
    </div>
  );
};

export default TimerContainer;
