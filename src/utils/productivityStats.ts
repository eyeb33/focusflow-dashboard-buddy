import { supabase } from '@/integrations/supabase/client';

export const updateDailyStats = async (userId: string, durationMinutes: number) => {
  try {
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: existingData, error: queryError } = await supabase
      .from('sessions_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
      
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw queryError;
    }
    
    const { data: recentDays, error: streakError } = await supabase
      .from('sessions_summary')
      .select('date')
      .eq('user_id', userId)
      .eq('total_completed_sessions', '>', 0)
      .order('date', { ascending: false });
      
    if (streakError) throw streakError;
    
    let currentStreak = calculateStreak(recentDays, today);
    
    if (existingData) {
      const { error } = await supabase
        .from('sessions_summary')
        .update({
          total_sessions: existingData.total_sessions + 1,
          total_focus_time: existingData.total_focus_time + durationMinutes,
          total_completed_sessions: existingData.total_completed_sessions + 1,
          longest_streak: Math.max(existingData.longest_streak, currentStreak),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('sessions_summary')
        .insert({
          user_id: userId,
          date: today,
          total_sessions: 1,
          total_focus_time: durationMinutes,
          total_completed_sessions: 1,
          longest_streak: currentStreak
        });
        
      if (error) throw error;
    }
    
    await updateProductivityScore(userId, today);
    
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
};

const calculateStreak = (recentDays: any[] | null, today: string) => {
  if (!recentDays || recentDays.length === 0) {
    return 1;
  }
  
  const dates = recentDays.map(day => new Date(day.date).toISOString().split('T')[0]);
  
  const todayIndex = dates.indexOf(today);
  if (todayIndex === -1) {
    dates.unshift(today);
  }
  
  let currentStreak = 1;
  
  for (let i = 1; i < dates.length; i++) {
    const currentDate = new Date(dates[i-1]);
    const prevDate = new Date(dates[i]);
    
    const diffTime = currentDate.getTime() - prevDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  return currentStreak;
};

const updateProductivityScore = async (userId: string, date: string) => {
  try {
    if (!userId) return;
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_type', 'work')
      .like('created_at', `${date}%`);
      
    if (sessionsError) throw sessionsError;
    
    const completedSessions = sessions.filter(s => s.completed).length;
    const totalDurationMinutes = sessions
      .filter(s => s.completed)
      .reduce((total, session) => total + (session.duration / 60), 0);
    
    const score = Math.min(
      100,
      (completedSessions * 10) + Math.floor(totalDurationMinutes / 3)
    );
    
    const { data: existingTrend, error: trendError } = await supabase
      .from('productivity_trends')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
      
    if (trendError && trendError.code !== 'PGRST116') {
      throw trendError;
    }
    
    if (existingTrend) {
      await supabase
        .from('productivity_trends')
        .update({
          productivity_score: score
        })
        .eq('id', existingTrend.id);
    } else {
      await supabase
        .from('productivity_trends')
        .insert({
          user_id: userId,
          date: date,
          productivity_score: score
        });
    }
    
    if (completedSessions >= 3) {
      await generateInsights(userId, completedSessions, totalDurationMinutes);
    }
    
  } catch (error) {
    console.error('Error updating productivity score:', error);
  }
};

const generateInsights = async (userId: string, sessionsCount: number, durationMinutes: number) => {
  try {
    if (!userId) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingInsights, error: insightError } = await supabase
      .from('insights')
      .select('created_at')
      .eq('user_id', userId)
      .like('created_at', `${today}%`)
      .order('created_at', { ascending: false });
      
    if (insightError) throw insightError;
    
    if (existingInsights && existingInsights.length === 0) {
      let title = '';
      let content = '';
      
      if (sessionsCount >= 8) {
        title = 'Productive Day!';
        content = `You've completed ${sessionsCount} focus sessions today for a total of ${Math.round(durationMinutes)} minutes. That's impressive dedication!`;
      } else if (sessionsCount >= 5) {
        title = 'Great Progress Today';
        content = `With ${sessionsCount} completed sessions, you're making excellent progress. Keep it up!`;
      } else {
        title = 'Building Momentum';
        content = `You've completed ${sessionsCount} focus sessions today. Each session helps build your productivity habits.`;
      }
      
      await supabase
        .from('insights')
        .insert({
          user_id: userId,
          title: title,
          content: content
        });
    }
  } catch (error) {
    console.error('Error generating insights:', error);
  }
};
