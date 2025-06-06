
/**
 * Utility functions for debugging the timer
 */

// Track timer tick execution
export const trackTimerTick = (
  prevTime: number,
  newTime: number,
  mode: string,
  timestamp: number
) => {
  const ticks = JSON.parse(localStorage.getItem('timerTicks') || '[]');
  
  // Keep only the last 10 ticks to avoid excessive storage
  if (ticks.length > 10) {
    ticks.shift();
  }
  
  ticks.push({
    prevTime,
    newTime,
    diff: prevTime - newTime,
    mode,
    timestamp
  });
  
  localStorage.setItem('timerTicks', JSON.stringify(ticks));
};

// Get timer execution report
export const getTimerTickReport = () => {
  const ticks = JSON.parse(localStorage.getItem('timerTicks') || '[]');
  return ticks;
};

// Clear timer tick history
export const clearTimerTicks = () => {
  localStorage.removeItem('timerTicks');
};

// Debug timer state
export const logTimerState = (state: any) => {
  console.log("TIMER STATE:", state);
};

// Debug timer settings
export const logTimerSettings = (settings: any) => {
  console.log("TIMER SETTINGS:", settings);
};

// Helper to check time mismatch between expected and actual
export const checkTimeMismatch = (
  expectedTime: number, 
  actualTime: number, 
  mode: string
) => {
  if (Math.abs(expectedTime - actualTime) > 5) {
    console.warn(`Time mismatch for ${mode} mode: expected=${expectedTime}, actual=${actualTime}`);
    return true;
  }
  return false;
};
