
/**
 * Timer debugging utilities
 */

// Log timer state changes with timestamp
export const logTimerStateChange = (
  action: string,
  before: {
    isRunning: boolean;
    timeRemaining: number;
    pausedTime: number | null;
  },
  after: {
    isRunning: boolean;
    timeRemaining: number;
    pausedTime: number | null;
  }
) => {
  console.log(`[${new Date().toISOString()}] [DEBUG] Timer ${action}:`, {
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
  data: any
) => {
  const actions = JSON.parse(localStorage.getItem('timerActions') || '[]');
  
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
  
  // Also log to console for immediate debugging
  console.log(`[${new Date().toISOString()}] [ACTION] ${action}:`, data);
};

// Debug specific timer event
export const debugTimerEvent = (source: string, event: string, data: any) => {
  console.log(`[${new Date().toISOString()}] [${source}] ${event}:`, data);
};

// Get timer action history
export const getTimerActionHistory = () => {
  return JSON.parse(localStorage.getItem('timerActions') || '[]');
};

// Clear timer action history
export const clearTimerActionHistory = () => {
  localStorage.removeItem('timerActions');
};

// Check if pausedTimeRef and timeRemaining are in sync
export const checkTimerStateConsistency = (
  isRunning: boolean, 
  timeRemaining: number, 
  pausedTime: number | null,
  source: string
) => {
  if (!isRunning && pausedTime === null && timeRemaining > 0) {
    console.warn(`[${new Date().toISOString()}] [${source}] INCONSISTENT STATE: Timer is paused but pausedTimeRef is null`);
    return false;
  }
  
  if (isRunning && pausedTime !== null) {
    console.warn(`[${new Date().toISOString()}] [${source}] INCONSISTENT STATE: Timer is running but pausedTimeRef is not null (${pausedTime})`);
    return false;
  }
  
  return true;
};
