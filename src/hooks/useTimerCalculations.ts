import { useMemo } from 'react';

// Timer mode type
export type TimerMode = 'work' | 'break' | 'longBreak';

// Color schemes for different timer modes
export interface TimerColors {
  solid: string;
  glow: string;
  fill: string;
  stroke: string;
  hex: string;
}

// Mode color mappings
const MODE_COLORS = {
  work: {
    solid: 'hsl(var(--timer-focus-bg))',
    glow: 'hsl(var(--timer-focus-bg) / 0.4)',
    fill: 'text-red-500',
    stroke: 'text-red-200',
    hex: '#ef4343',
  },
  break: {
    solid: 'hsl(var(--timer-break-bg))',
    glow: 'hsl(var(--timer-break-bg) / 0.4)',
    fill: 'text-green-500',
    stroke: 'text-green-200',
    hex: '#2fc55e',
  },
  longBreak: {
    solid: 'hsl(var(--timer-longbreak-bg))',
    glow: 'hsl(var(--timer-longbreak-bg) / 0.4)',
    fill: 'text-blue-500',
    stroke: 'text-blue-200',
    hex: '#3b81f6',
  },
} as const;

// Map internal mode to display mode (focus instead of work for UI)
export type DisplayMode = 'focus' | 'break' | 'longBreak';

/**
 * Format seconds into MM:SS string
 */
export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get display-friendly mode label
 */
export function getModeLabel(mode: TimerMode): string {
  switch (mode) {
    case 'break': return 'Short Break';
    case 'longBreak': return 'Long Break';
    case 'work':
    default: return 'Focus';
  }
}

/**
 * Convert TimerMode to DisplayMode for UI components
 */
export function toDisplayMode(mode: TimerMode): DisplayMode {
  return mode === 'work' ? 'focus' : mode;
}

/**
 * Get colors for a given timer mode
 */
export function getModeColors(mode: TimerMode | DisplayMode): TimerColors {
  const normalizedMode = mode === 'focus' ? 'work' : mode;
  return MODE_COLORS[normalizedMode as TimerMode] || MODE_COLORS.work;
}

interface TimerCalculationsInput {
  timeRemaining: number;
  totalSeconds: number;
  mode: TimerMode;
  isFreeStudy?: boolean;
}

interface TimerCalculationsResult {
  // Sanitized values
  safeTimeRemaining: number;
  safeTotalSeconds: number;
  
  // Formatted time
  minutes: number;
  seconds: number;
  formattedTime: string;
  
  // Progress (0-100, increases as time decreases)
  progress: number;
  
  // SVG ring calculations
  circumference: number;
  dashOffset: number;
  
  // Mode info
  colors: TimerColors;
  displayMode: DisplayMode;
  modeLabel: string;
  
  // State checks
  isLastTenSeconds: boolean;
  hasStarted: boolean;
  isComplete: boolean;
}

/**
 * Hook for consolidated timer calculations
 * Eliminates duplicate logic across timer components
 */
export function useTimerCalculations({
  timeRemaining,
  totalSeconds,
  mode,
  isFreeStudy = false,
}: TimerCalculationsInput): TimerCalculationsResult {
  return useMemo(() => {
    // Sanitize inputs
    const safeTimeRemaining = isNaN(timeRemaining) ? 0 : Math.max(0, timeRemaining);
    const safeTotalSeconds = isNaN(totalSeconds) ? 1 : Math.max(1, totalSeconds);
    
    // Clamp time remaining for pomodoro mode
    const clampedTimeRemaining = isFreeStudy 
      ? safeTimeRemaining 
      : Math.min(safeTimeRemaining, safeTotalSeconds);
    
    // Time components
    const minutes = Math.floor(clampedTimeRemaining / 60);
    const seconds = clampedTimeRemaining % 60;
    const formattedTime = formatTime(clampedTimeRemaining);
    
    // Progress calculation (0 at start, 100 when complete)
    // For free study, progress is always 0 (no progress ring)
    const progress = isFreeStudy 
      ? 0 
      : safeTotalSeconds > 0 
        ? ((safeTotalSeconds - clampedTimeRemaining) / safeTotalSeconds) * 100 
        : 0;
    
    // SVG ring calculations (standard 220px timer)
    const size = 220;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress / 100);
    
    // Mode colors and labels
    const colors = getModeColors(mode);
    const displayMode = toDisplayMode(mode);
    const modeLabel = getModeLabel(mode);
    
    // State checks
    const isLastTenSeconds = clampedTimeRemaining <= 10 && clampedTimeRemaining > 0;
    const hasStarted = clampedTimeRemaining < safeTotalSeconds;
    const isComplete = clampedTimeRemaining <= 0;
    
    return {
      safeTimeRemaining: clampedTimeRemaining,
      safeTotalSeconds,
      minutes,
      seconds,
      formattedTime,
      progress,
      circumference,
      dashOffset,
      colors,
      displayMode,
      modeLabel,
      isLastTenSeconds,
      hasStarted,
      isComplete,
    };
  }, [timeRemaining, totalSeconds, mode, isFreeStudy]);
}

interface SessionCalculationsInput {
  completedSessions: number;
  totalSessions: number;
  currentSessionIndex: number;
  mode: TimerMode;
}

interface SessionDot {
  index: number;
  isCompleted: boolean;
  isCurrent: boolean;
  size: number;
}

interface SessionCalculationsResult {
  sessionDots: SessionDot[];
  colors: TimerColors;
  isWorkMode: boolean;
  isBreakMode: boolean;
  isLongBreakMode: boolean;
}

/**
 * Hook for session dot/ring calculations
 * Consolidates logic from SessionProgress, SessionRings, and TimerCircle
 */
export function useSessionCalculations({
  completedSessions,
  totalSessions,
  currentSessionIndex,
  mode,
}: SessionCalculationsInput): SessionCalculationsResult {
  return useMemo(() => {
    const colors = getModeColors(mode);
    const isWorkMode = mode === 'work';
    const isBreakMode = mode === 'break';
    const isLongBreakMode = mode === 'longBreak';
    
    const sessionDots: SessionDot[] = Array.from({ length: totalSessions }).map((_, index) => {
      const isCompleted = index < completedSessions;
      const isCurrent = index === currentSessionIndex;
      const size = isCurrent ? 16 : 12; // Active dot is larger
      
      return { index, isCompleted, isCurrent, size };
    });
    
    return {
      sessionDots,
      colors,
      isWorkMode,
      isBreakMode,
      isLongBreakMode,
    };
  }, [completedSessions, totalSessions, currentSessionIndex, mode]);
}

/**
 * Get total seconds for a mode based on settings
 */
export function getTotalSecondsForMode(
  mode: TimerMode,
  settings: {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
  }
): number {
  switch (mode) {
    case 'work': return settings.workDuration * 60;
    case 'break': return settings.breakDuration * 60;
    case 'longBreak': return settings.longBreakDuration * 60;
    default: return settings.workDuration * 60;
  }
}
