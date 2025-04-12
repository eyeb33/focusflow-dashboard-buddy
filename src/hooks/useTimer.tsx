
// This file re-exports the useTimer hook from TimerContext
// and adds additional specialized hooks

import { useTimer as useTimerContext } from '@/contexts/TimerContext';
import { useTimerControls } from './useTimerControls';
import { useTimerStats } from './useTimerStats';
import { useTimerSettings } from './useTimerSettings';

// Re-export the main hook
export const useTimer = useTimerContext;

// Export specialized hooks
export { useTimerControls, useTimerStats, useTimerSettings };
