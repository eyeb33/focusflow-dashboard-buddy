
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getModeLabel = (timerMode: 'work' | 'break' | 'longBreak'): string => {
  switch (timerMode) {
    case 'break':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
    case 'work':
    default:
      return 'Focus';
  }
};
