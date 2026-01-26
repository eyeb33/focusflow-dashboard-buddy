import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useTopicTimeTracking } from '@/hooks/useTopicTimeTracking';
import { useTimerContext } from '@/contexts/TimerContext';

interface TopicTimeContextType {
  // State
  currentTimerSessionId: string | null;
  currentTopicId: string | null;
  isTimerRunning: boolean;
  topicTotalTimes: Record<string, number>;
  
  // Actions
  setActiveTopicForTimer: (topicId: string | null) => Promise<void>;
  getTopicTotalTime: (topicId: string) => number;
  
  // Sync methods
  refetchTotals: () => Promise<void>;
}

const TopicTimeContext = createContext<TopicTimeContextType | undefined>(undefined);

export const TopicTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const timer = useTimerContext();
  const tracking = useTopicTimeTracking();
  
  // Track previous timer running state to detect start/stop transitions
  const prevIsRunningRef = useRef(timer.isRunning);
  const prevTopicIdRef = useRef<string | null>(null);
  
  // Handle timer start/stop transitions
  useEffect(() => {
    const wasRunning = prevIsRunningRef.current;
    const isNowRunning = timer.isRunning;
    
    const handleTimerTransition = async () => {
      // Timer just started
      if (!wasRunning && isNowRunning && tracking.currentTopicId) {
        await tracking.startTimer(
          tracking.currentTopicId, 
          timer.timerType === 'freeStudy' ? 'free' : 'pomodoro'
        );
      }
      
      // Timer just paused (not stopped)
      if (wasRunning && !isNowRunning && tracking.currentTimerSessionId) {
        await tracking.pauseTimer();
      }
    };
    
    handleTimerTransition();
    prevIsRunningRef.current = isNowRunning;
  }, [timer.isRunning, timer.timerType, tracking]);

  // Handle topic changes while timer is running
  const setActiveTopicForTimer = useCallback(async (topicId: string | null) => {
    if (!topicId) return;
    
    const prevTopicId = prevTopicIdRef.current;
    prevTopicIdRef.current = topicId;
    
    // If no previous topic, this is initial set
    if (!prevTopicId) {
      // If timer is already running, we need to start tracking for this topic
      if (timer.isRunning && !tracking.currentTimerSessionId) {
        await tracking.startTimer(
          topicId, 
          timer.timerType === 'freeStudy' ? 'free' : 'pomodoro'
        );
      }
      return;
    }
    
    // Topic is changing
    if (prevTopicId !== topicId) {
      // If timer is running, switch the segment to new topic
      if (timer.isRunning) {
        await tracking.switchTopic(topicId);
      }
      // If timer is paused, just update the topic reference for next resume
      else if (tracking.currentTimerSessionId) {
        // Update internal state - next resume will use this topic
        await tracking.switchTopic(topicId);
      }
    }
  }, [timer.isRunning, timer.timerType, tracking]);

  // Cleanup: stop tracking when timer is reset
  useEffect(() => {
    // Listen for reset events
    const handleReset = () => {
      if (tracking.currentTimerSessionId) {
        tracking.stopTimer();
      }
    };
    
    window.addEventListener('timer:reset', handleReset);
    return () => window.removeEventListener('timer:reset', handleReset);
  }, [tracking]);

  const value: TopicTimeContextType = {
    currentTimerSessionId: tracking.currentTimerSessionId,
    currentTopicId: tracking.currentTopicId,
    isTimerRunning: tracking.isTimerRunning,
    topicTotalTimes: tracking.topicTotalTimes,
    setActiveTopicForTimer,
    getTopicTotalTime: tracking.getTopicTotalTime,
    refetchTotals: tracking.refetchTotals,
  };

  return (
    <TopicTimeContext.Provider value={value}>
      {children}
    </TopicTimeContext.Provider>
  );
};

export const useTopicTime = (): TopicTimeContextType => {
  const context = useContext(TopicTimeContext);
  if (!context) {
    throw new Error('useTopicTime must be used within a TopicTimeProvider');
  }
  return context;
};
