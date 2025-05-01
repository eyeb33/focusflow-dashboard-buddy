
export function useTimerFormat() {
  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get mode label helper - now accepts an optional parameter
  const getModeLabel = (timerMode?: string): string => {
    // If no mode is provided, return a default
    const mode = timerMode || 'work';
    
    switch (mode) {
      case 'work': return 'Focus';
      case 'break': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Timer';
    }
  };
  
  return {
    formatTime,
    getModeLabel
  };
}
