import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getMascotReaction, getMascotEncouragement, getMascotTip, MascotReaction } from '@/types/mascotSystem';

interface StreakData {
  currentStreak: number;
  consecutiveDays: number;
  sessionsToday: number;
  topicsExplored: number;
  totalProblemsAttempted: number;
  totalCorrectAnswers: number;
  lastActivityDate: string;
}

interface BehaviorPattern {
  rushingThroughProblems?: boolean;
  avoidingDifficultTopics?: boolean;
  notUsingHints?: boolean;
  perfectStudySessions?: number;
}

export const useMascotStreak = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    consecutiveDays: 0,
    sessionsToday: 0,
    topicsExplored: 0,
    totalProblemsAttempted: 0,
    totalCorrectAnswers: 0,
    lastActivityDate: new Date().toISOString().split('T')[0],
  });
  const [behaviorPattern, setBehaviorPattern] = useState<BehaviorPattern>({});

  // Load streak data from database
  useEffect(() => {
    if (!user) return;

    const loadStreakData = async () => {
      const { data, error } = await supabase
        .from('mascot_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setStreakData({
          currentStreak: data.current_streak || 0,
          consecutiveDays: data.consecutive_days || 0,
          sessionsToday: data.sessions_today || 0,
          topicsExplored: data.topics_explored || 0,
          totalProblemsAttempted: data.total_problems_attempted || 0,
          totalCorrectAnswers: data.total_correct_answers || 0,
          lastActivityDate: data.last_activity_date || new Date().toISOString().split('T')[0],
        });
        
        // Load behavior patterns
        if (data.behavior_patterns) {
          setBehaviorPattern(data.behavior_patterns as BehaviorPattern);
        }
      }
    };

    loadStreakData();
  }, [user]);

  // Record correct answer and update streak
  const recordCorrectAnswer = useCallback(async () => {
    if (!user) return null;

    const newStreak = streakData.currentStreak + 1;
    const newTotal = streakData.totalCorrectAnswers + 1;
    const newAttempted = streakData.totalProblemsAttempted + 1;

    setStreakData(prev => ({
      ...prev,
      currentStreak: newStreak,
      totalCorrectAnswers: newTotal,
      totalProblemsAttempted: newAttempted,
    }));

    // Update database with error handling
    try {
      const { error } = await supabase
        .from('mascot_streaks')
        .upsert({
          user_id: user.id,
          current_streak: newStreak,
          total_correct_answers: newTotal,
          total_problems_attempted: newAttempted,
          last_activity_date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error updating streak:', error);
      }
    } catch (error) {
      console.error('Failed to update streak:', error);
    }

    // Get mascot reaction
    return getMascotReaction({
      type: 'correct',
      context: { streakCount: newStreak }
    });
  }, [user, streakData]);

  // Record incorrect answer (breaks streak)
  const recordIncorrectAnswer = useCallback(async () => {
    if (!user) return null;

    const newAttempted = streakData.totalProblemsAttempted + 1;

    setStreakData(prev => ({
      ...prev,
      currentStreak: 0,
      totalProblemsAttempted: newAttempted,
    }));

    // Update database with error handling
    try {
      const { error } = await supabase
        .from('mascot_streaks')
        .upsert({
          user_id: user.id,
          current_streak: 0,
          total_problems_attempted: newAttempted,
          last_activity_date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error updating streak:', error);
      }
    } catch (error) {
      console.error('Failed to update streak:', error);
    }

    // Get mascot encouragement reaction
    return getMascotReaction({ type: 'incorrect' });
  }, [user, streakData]);

  // Record hint used
  const recordHintUsed = useCallback(async () => {
    if (!user) return null;

    // Get mascot reaction for hint usage
    return getMascotReaction({ type: 'hint-used' });
  }, [user]);

  // Record persistence (student trying again after mistake)
  const recordPersistence = useCallback(async (attemptsOnSameProblem: number) => {
    if (!user) return null;

    return getMascotReaction({
      type: 'persist',
      context: { attemptsOnSameProblem }
    });
  }, [user]);

  // Record session completion
  const recordSessionComplete = useCallback(async () => {
    if (!user) return null;

    const newSessionsToday = streakData.sessionsToday + 1;

    setStreakData(prev => ({
      ...prev,
      sessionsToday: newSessionsToday,
    }));

    try {
      const { error } = await supabase
        .from('mascot_streaks')
        .upsert({
          user_id: user.id,
          sessions_today: newSessionsToday,
          last_activity_date: new Date().toISOString().split('T')[0],
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error updating session:', error);
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }

    return getMascotReaction({ type: 'complete' });
  }, [user, streakData]);

  // Get encouragement based on patterns
  const getEncouragement = useCallback((): MascotReaction | null => {
    const encouragementText = getMascotEncouragement({
      consecutiveDays: streakData.consecutiveDays,
      sessionsToday: streakData.sessionsToday,
      topicsExplored: streakData.topicsExplored,
    });

    if (!encouragementText) return null;

    return {
      state: 'encouraging',
      message: encouragementText,
      duration: 4000,
    };
  }, [streakData]);

  // Get behavioral tip
  const getBehavioralTip = useCallback((): string | null => {
    return getMascotTip(behaviorPattern);
  }, [behaviorPattern]);

  // Update consecutive days streak (call this on new session start)
  const updateDailyStreak = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (streakData.lastActivityDate === today) {
      // Already counted today
      return;
    }

    let newConsecutiveDays = streakData.consecutiveDays;
    
    if (streakData.lastActivityDate === yesterday) {
      // Continue streak
      newConsecutiveDays += 1;
    } else if (streakData.lastActivityDate < yesterday) {
      // Streak broken, restart
      newConsecutiveDays = 1;
    }

    setStreakData(prev => ({
      ...prev,
      consecutiveDays: newConsecutiveDays,
      sessionsToday: 0, // Reset daily count
      lastActivityDate: today,
    }));

    try {
      const { error } = await supabase
        .from('mascot_streaks')
        .upsert({
          user_id: user.id,
          consecutive_days: newConsecutiveDays,
          sessions_today: 0,
          last_activity_date: today,
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Error updating daily streak:', error);
      }
    } catch (error) {
      console.error('Failed to update daily streak:', error);
    }
  }, [user, streakData]);

  return {
    streakData,
    recordCorrectAnswer,
    recordIncorrectAnswer,
    recordHintUsed,
    recordPersistence,
    recordSessionComplete,
    getEncouragement,
    getBehavioralTip,
    updateDailyStreak,
  };
};
