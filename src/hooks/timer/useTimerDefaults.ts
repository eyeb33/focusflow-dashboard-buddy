
// Default timer settings
export const DEFAULT_TIMER_SETTINGS = {
  workDuration: 25, // minutes
  breakDuration: 5, // minutes
  longBreakDuration: 15, // minutes
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,  // Automatically start break timers
  autoStartFocus: false,  // Don't automatically start focus timer after breaks
  showNotifications: true,
  soundEnabled: true,
  soundVolume: 0.75,
  soundId: 'zen-bell'
};

// Timer mode colors
export const TIMER_COLORS = {
  work: 'hsl(0, 100%, 60%)', // Red
  break: 'hsl(145, 80%, 42%)', // Green
  longBreak: 'hsl(210, 100%, 55%)' // Blue
};
