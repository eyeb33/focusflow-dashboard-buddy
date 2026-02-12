
// Re-export TimerMode from consolidated hook
export { type TimerMode, getTotalSecondsForMode } from '@/hooks/useTimerCalculations';

import type { TimerMode } from '@/hooks/useTimerCalculations';

// Alias for backwards compatibility
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
    return {
      completedSessions: 0,
      totalTimeToday: 0
    };
  } catch (error) {
    console.error('Error loading today stats:', error);
    return null;
  }
};

// Save partial session using database function with retry logic
export const savePartialSession = async (
  userId: string | undefined,
  mode: TimerMode,
  totalTime: number,
  remainingTime: number,
  lastRecordedMinutes: number,
  startDate?: string
): Promise<void> => {
  if (!userId) return;
  
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { retryWithBackoff } = await import('@/lib/utils');
    const elapsedTime = totalTime - remainingTime;
    
    // Only save if at least 1 minute has elapsed
    if (elapsedTime >= 60) {
      await retryWithBackoff(
        async () => {
          const { error } = await supabase.rpc('save_session_progress', {
            p_user_id: userId,
            p_session_type: mode === 'work' ? 'work' : mode === 'break' ? 'short_break' : 'long_break',
            p_duration: Math.floor(elapsedTime),
            p_completed: false
          });
          if (error) throw error;
        },
        { 
          maxRetries: 2, // Fewer retries for background saves
          initialDelayMs: 500 
        }
      );
    }
  } catch (error) {
    // Silent fail for partial saves - they're not critical
    console.error('Error saving partial session:', error);
  }
};
