
/**
 * Calculates the current streak based on days with completed sessions
 */
export const calculateStreak = (recentDays: any[] | null, today: string) => {
  if (!recentDays || recentDays.length === 0) {
    return 0; // No streak if there are no completed sessions
  }
  
  // Make sure today is a valid date string in YYYY-MM-DD format
  const todayDate = new Date(today);
  if (isNaN(todayDate.getTime())) {
    console.error('Invalid date provided for streak calculation:', today);
    // Fallback to current date
    const currentDate = new Date();
    today = currentDate.toISOString().split('T')[0];
  }
  
  console.log('Calculating streak with today as:', today);
  
  // Sort dates in descending order (newest first)
  const sortedDates = [...recentDays]
    .filter(day => day.sessions > 0) // Only include days with sessions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(day => day.date);
  
  // Check if today is already in the dates array
  const todayIndex = sortedDates.indexOf(today);
  const hasSessionsToday = todayIndex !== -1;
  
  // If no sessions today, we need to check if yesterday had sessions
  // to determine if the streak is still active
  if (!hasSessionsToday) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('No sessions today, checking yesterday:', yesterdayStr);
    
    // If yesterday is not in the list, streak is broken
    if (!sortedDates.includes(yesterdayStr)) {
      console.log('Yesterday not found in dates, streak broken');
      return 0;
    }
    
    // Start counting from yesterday since it's the most recent day with activity
    sortedDates.unshift(yesterdayStr);
  } else {
    // Today has sessions, so we start from today
    sortedDates.unshift(today);
  }
  
  let currentStreak = hasSessionsToday ? 1 : 0;
  
  // Log the dates we're working with
  console.log('Sorted dates for streak calculation:', sortedDates);
  
  // Loop through dates to find consecutive days
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDate = new Date(sortedDates[i]);
    const nextDate = new Date(sortedDates[i + 1]);
    
    // Calculate the difference in days
    const diffTime = currentDate.getTime() - nextDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    console.log(`Comparing ${sortedDates[i]} and ${sortedDates[i+1]}, diff: ${diffDays} days`);
    
    // If the days are consecutive (1 day apart), increment the streak
    if (diffDays === 1) {
      currentStreak++;
    } else {
      console.log(`Break in streak at ${sortedDates[i+1]}, diff was ${diffDays} days`);
      break; // Break the streak if days are not consecutive
    }
  }
  
  console.log('Final calculated streak:', currentStreak);
  return currentStreak;
};
