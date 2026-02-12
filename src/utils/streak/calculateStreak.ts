import { StreakDay } from '@/types/database';

/**
 * Calculates the current streak based on days with completed sessions
 */
export const calculateStreak = (recentDays: StreakDay[] | null, today: string): number => {
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
  
  // Filter only days with at least one session completed
  const activeDays = recentDays
    .filter(day => day.sessions > 0) 
    .map(day => day.date);
  
  if (activeDays.length === 0) {
    return 0; // No streak if no active days
  }
  
  // Check if today has sessions
  const hasSessionsToday = activeDays.includes(today);
  
  // Sort dates in descending order (newest first)
  const sortedDates = [...activeDays].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
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
  }
  
  // Start counting streak
  let currentStreak = hasSessionsToday ? 1 : 0;
  
  // Get the starting date for streak calculation
  let currentDate = hasSessionsToday ? today : sortedDates[0];
  
  // Log the dates we're working with
  console.log('Sorted dates for streak calculation:', sortedDates);
  console.log('Starting streak calculation from date:', currentDate);
  
  // Loop through previous days to count consecutive days
  for (let i = 0; i < 366; i++) { // Limit to a year
    // Get previous day
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    
    // If previous day is in the active days list, increment streak
    if (sortedDates.includes(prevDateStr)) {
      currentStreak++;
      currentDate = prevDateStr;
      console.log(`Found consecutive day: ${prevDateStr}, streak now: ${currentStreak}`);
    } else {
      // Break when we find a gap
      console.log(`Streak break: ${prevDateStr} not found in active days`);
      break;
    }
  }
  
  console.log('Final calculated streak:', currentStreak);
  return currentStreak;
};
