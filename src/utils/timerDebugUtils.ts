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
};

// Get timer action history
export const getTimerActionHistory = () => {
  return JSON.parse(localStorage.getItem('timerActions') || '[]');
};
