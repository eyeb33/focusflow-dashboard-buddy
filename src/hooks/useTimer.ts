
import { useTimer as useTimerImplementation } from './useTimer.tsx';
import { TimerSettings } from './useTimerSettings';

// Export the timer hook from the .tsx implementation with proper types
export const useTimer = useTimerImplementation;

// Re-export TimerSettings type for consistency
export type { TimerSettings };
