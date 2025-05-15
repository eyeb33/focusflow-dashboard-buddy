
/**
 * Global type definitions for the application
 */

interface Window {
  timerContext?: {
    timeRemaining: number;
    isRunning: boolean;
    timerMode: string;
    onVisibilityChange?: () => void;
  };
}
