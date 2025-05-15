
// Define the TimerMode type to ensure consistency across the app
export type TimerMode = 'work' | 'break' | 'longBreak';

// Function to get total time based on mode and settings
export const getTotalTime = (
  mode: TimerMode, 
  settings: { 
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  }
): number => {
  switch (mode) {
    case 'work':
      return settings.workDuration * 60;
    case 'break':
      return settings.breakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
    default:
      return settings.workDuration * 60;
  }
};

// Function to save partial session data
export const savePartialSession = async (
  userId: string | undefined,
  mode: TimerMode,
  totalTime: number,
  remainingTime: number,
  lastRecordedMinutes: number
): Promise<void> => {
  if (!userId) return;
  
  try {
    // Log the partial session for now
    console.log('Saving partial session:', {
      userId,
      mode,
      totalTime,
      remainingTime,
      lastRecordedMinutes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving partial session:', error);
  }
};
