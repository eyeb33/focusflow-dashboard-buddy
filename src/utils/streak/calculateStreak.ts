
/**
 * Calculates the current streak based on days with completed sessions
 */
export const calculateStreak = (recentDays: any[] | null, today: string) => {
  if (!recentDays || recentDays.length === 0) {
    return 1; // Today is the first day with completed sessions
  }
  
  const dates = recentDays.map(day => new Date(day.date).toISOString().split('T')[0]);
  
  // Check if today is already in the dates array
  const todayIndex = dates.indexOf(today);
  if (todayIndex === -1) {
    dates.unshift(today); // Add today to the beginning of the array if not already present
  }
  
  let currentStreak = 1; // Start with today
  
  // Loop through dates (which are sorted in descending order) to find consecutive days
  for (let i = 0; i < dates.length - 1; i++) {
    const currentDate = new Date(dates[i]);
    const nextDate = new Date(dates[i + 1]);
    
    // Calculate the difference in days
    const diffTime = Math.abs(currentDate.getTime() - nextDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If the days are consecutive (1 day apart), increment the streak
    if (diffDays === 1) {
      currentStreak++;
    } else {
      break; // Break the streak if days are not consecutive
    }
  }
  
  return currentStreak;
};
