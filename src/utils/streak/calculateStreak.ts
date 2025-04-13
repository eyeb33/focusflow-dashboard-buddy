
/**
 * Calculates the current streak based on days with completed sessions
 */
export const calculateStreak = (recentDays: any[] | null, today: string) => {
  if (!recentDays || recentDays.length === 0) {
    return 1; // Today is the first day with completed sessions
  }
  
  // Format all dates to YYYY-MM-DD to ensure consistent comparison
  const dates = recentDays.map(day => new Date(day.date).toISOString().split('T')[0]);
  
  // Check if today is already in the dates array
  const todayIndex = dates.indexOf(today);
  const hasCompletedSessionsToday = todayIndex !== -1;
  
  // If today isn't in the array yet (new completed session), add it
  if (!hasCompletedSessionsToday) {
    dates.unshift(today);
  }
  
  let currentStreak = 1; // Start with today or the most recent day
  
  // Sort dates in descending order (newest first)
  const sortedDates = [...new Set(dates)].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  // Loop through dates (which are sorted in descending order) to find consecutive days
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDate = new Date(sortedDates[i]);
    const nextDate = new Date(sortedDates[i + 1]);
    
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
  
  console.log(`Calculated streak: ${currentStreak} days from dates:`, sortedDates);
  return currentStreak;
};
