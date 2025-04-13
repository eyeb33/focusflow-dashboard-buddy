
/**
 * Calculates the current streak based on days with completed sessions
 */
export const calculateStreak = (recentDays: any[] | null, today: string) => {
  if (!recentDays || recentDays.length === 0) {
    return 0; // No completed sessions yet
  }
  
  // Format all dates to YYYY-MM-DD to ensure consistent comparison
  const dates = recentDays.map(day => new Date(day.date).toISOString().split('T')[0]);
  
  // Check if today is already in the dates array
  const todayDate = new Date(today).toISOString().split('T')[0];
  const hasCompletedSessionsToday = dates.includes(todayDate);
  
  // Sort dates in descending order (newest first)
  const sortedDates = [...new Set(dates)].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  // If today isn't in the array yet but we have completed a session today,
  // add it to the sorted dates for streak calculation
  if (!hasCompletedSessionsToday && sortedDates.length > 0) {
    // Only add today if we're calculating today's streak (not a historical one)
    const mostRecentDate = sortedDates[0];
    const oneDayMs = 24 * 60 * 60 * 1000;
    const dayDiff = Math.abs(new Date(todayDate).getTime() - new Date(mostRecentDate).getTime()) / oneDayMs;
    
    if (dayDiff <= 1) {
      sortedDates.unshift(todayDate);
    }
  }
  
  let currentStreak = hasCompletedSessionsToday ? 1 : 0;
  
  // If no sessions today, check if yesterday has a session to continue the streak
  if (!hasCompletedSessionsToday && sortedDates.length > 0) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // If the most recent day was yesterday, we can still have a streak
    if (sortedDates[0] === yesterdayStr) {
      currentStreak = 1;
    } else {
      // No sessions today or yesterday = no active streak
      return 0;
    }
  }
  
  // Loop through dates to find consecutive days
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
