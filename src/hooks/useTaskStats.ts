
import { useCallback } from 'react';

export function useTaskStats() {
  const handleWorkCompletion = useCallback((userId?: string, sessionStartTime?: string | null) => {
    console.log('Work session completed', { userId, sessionStartTime });
    // In a real app, this would update database records
  }, []);

  const handleBreakCompletion = useCallback((userId?: string, sessionStartTime?: string | null) => {
    console.log('Break session completed', { userId, sessionStartTime });
    // In a real app, this would update database records
  }, []);

  const handleLongBreakCompletion = useCallback((userId?: string, sessionStartTime?: string | null) => {
    console.log('Long break session completed', { userId, sessionStartTime });
    // In a real app, this would update database records
  }, []);

  return {
    handleWorkCompletion,
    handleBreakCompletion,
    handleLongBreakCompletion
  };
}
