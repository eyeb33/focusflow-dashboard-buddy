
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

// Add loadTodayStats function that was missing
export const loadTodayStats = async (userId: string): Promise<{ 
  completedSessions: number;
  totalTimeToday: number;
} | null> => {
  if (!userId) return null;
  
  try {
    // For now just returning a placeholder
    // In a production app, this would typically fetch from a database
    console.log('Loading stats for user:', userId);
    return {
      completedSessions: 0,
      totalTimeToday: 0
    };
  } catch (error) {
    console.error('Error loading today stats:', error);
    return null;
  }
};

// Function to save partial session data
export const savePartialSession = async (
  userId: string | undefined,
  mode: TimerMode,
  totalTime: number,
  remainingTime: number,
  lastRecordedMinutes: number,
  startDate?: string
): Promise<{ 
  success: boolean;
  newFullMinutes?: number;
} | void> => {
  if (!userId) return;
  
  try {
    // Log the partial session for now
    console.log('Saving partial session:', {
      userId,
      mode,
      totalTime,
      remainingTime,
      lastRecordedMinutes,
      timestamp: new Date().toISOString(),
      startDate
    });
    
    // Return success with the updated minutes count
    return {
      success: true,
      newFullMinutes: Math.floor((totalTime - remainingTime) / 60)
    };
  } catch (error) {
    console.error('Error saving partial session:', error);
  }
};
