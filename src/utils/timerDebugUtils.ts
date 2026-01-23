import { TimerActionData } from '@/types/database';

/**
 * Timer debugging utilities
 */

interface TimerState {
  isRunning: boolean;
  timeRemaining: number;
  pausedTime: number | null;
}

interface StoredTimerAction {
  action: string;
  data: TimerActionData;
  timestamp: string;
}

interface TimerAccuracySample {
  from: number;
  to: number;
  mode: string;
  timestamp: number;
  expected: number;
  drift: number;
}

// Log timer state changes with timestamp
export const logTimerStateChange = (
  action: string,
  before: TimerState,
  after: TimerState
): void => {
  console.log(`[${new Date().toISOString()}] Timer ${action}:`, {
    before,
    after,
    diff: {
      isRunning: before.isRunning !== after.isRunning ? 'CHANGED' : 'same',
      timeRemaining: before.timeRemaining !== after.timeRemaining 
        ? `${before.timeRemaining} -> ${after.timeRemaining}` 
        : 'same',
      pausedTime: before.pausedTime !== after.pausedTime ? 'CHANGED' : 'same'
    }
  });
};

// Track timer actions
export const trackTimerAction = (
  action: 'start' | 'pause' | 'reset' | 'mode-change',
  data: TimerActionData
): void => {
  const actions: StoredTimerAction[] = JSON.parse(localStorage.getItem('timerActions') || '[]');
  
  // Keep only the last 20 actions
  if (actions.length > 20) {
    actions.shift();
  }
  
  actions.push({
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  localStorage.setItem('timerActions', JSON.stringify(actions));
};

// Get timer action history
export const getTimerActionHistory = (): StoredTimerAction[] => {
  return JSON.parse(localStorage.getItem('timerActions') || '[]');
};

// Track tick timing accuracy for debugging
export const trackTimerTick = (
  prevTime: number,
  newTime: number,
  mode: string,
  timestamp: number
): void => {
  const timerAccuracy: TimerAccuracySample[] = JSON.parse(localStorage.getItem('timerAccuracy') || '[]');
  
  // Keep only recent samples
  if (timerAccuracy.length > 100) {
    timerAccuracy.shift();
  }
  
  // Only record data every 5 seconds to avoid too much data
  if (newTime % 5 === 0 || newTime <= 5) {
    timerAccuracy.push({
      from: prevTime,
      to: newTime,
      mode,
      timestamp,
      expected: prevTime - 1, // We expect to decrease by 1 second
      drift: (prevTime - 1) - newTime // Positive = too fast, negative = too slow
    });
    
    localStorage.setItem('timerAccuracy', JSON.stringify(timerAccuracy));
  }
};
