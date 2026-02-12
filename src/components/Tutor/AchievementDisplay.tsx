import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Achievement, getTierColor, getTierBgColor, checkAchievements, ACHIEVEMENTS } from '@/types/achievement';
import { Trophy, Star, Flame, Target, Map, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AchievementToastProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      "fixed top-20 right-4 z-50",
      "max-w-sm p-4 rounded-lg border-2 shadow-2xl",
      "animate-in slide-in-from-right-full",
      getTierBgColor(achievement.tier)
    )}>
      <div className="flex items-start gap-3">
        <div className="text-4xl">{achievement.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className={cn("h-4 w-4", getTierColor(achievement.tier))} />
            <span className={cn("text-xs font-bold uppercase", getTierColor(achievement.tier))}>
              {achievement.tier} Achievement
            </span>
          </div>
          <h3 className="font-bold text-lg">{achievement.name}</h3>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ 
  achievement, 
  unlocked,
  progress 
}) => {
  const getCategoryIcon = () => {
    switch (achievement.category) {
      case 'streak':
        return <Flame className="h-4 w-4" />;
      case 'mastery':
        return <Star className="h-4 w-4" />;
      case 'persistence':
        return <Target className="h-4 w-4" />;
      case 'exploration':
        return <Map className="h-4 w-4" />;
      case 'speed':
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn(
      "relative p-3 rounded-lg border transition-all",
      unlocked 
        ? cn(getTierBgColor(achievement.tier), "scale-100")
        : "bg-muted/50 border-muted opacity-60 grayscale"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "text-3xl transition-all",
          !unlocked && "opacity-30"
        )}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn(
              unlocked ? getTierColor(achievement.tier) : "text-muted-foreground"
            )}>
              {getCategoryIcon()}
            </div>
            <span className={cn(
              "text-xs font-semibold uppercase",
              unlocked ? getTierColor(achievement.tier) : "text-muted-foreground"
            )}>
              {achievement.tier}
            </span>
          </div>
          <h4 className="font-semibold text-sm mb-1">{achievement.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
          
          {!unlocked && progress !== undefined && progress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
        </div>
      </div>
      
      {unlocked && achievement.unlockedAt && (
        <div className="absolute top-2 right-2">
          <Trophy className={cn("h-4 w-4", getTierColor(achievement.tier))} />
        </div>
      )}
    </div>
  );
};

interface AchievementsPanelProps {
  className?: string;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ className }) => {
  const { user } = useAuth();
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [stats, setStats] = useState({
    currentStreak: 0,
    consecutiveDays: 0,
    examReadyTopics: 0,
    persistenceCount: 0,
    topicsExplored: 0,
    totalSessions: 0,
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Load unlocked achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('achievement_id')
        .eq('user_id', user.id);

      if (achievementsData) {
        setUnlockedAchievements(achievementsData.map(a => a.achievement_id));
      }

      // Load stats
      const { data: streakData } = await supabase
        .from('mascot_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakData) {
        setStats({
          currentStreak: streakData.current_streak || 0,
          consecutiveDays: streakData.consecutive_days || 0,
          examReadyTopics: streakData.exam_ready_topics || 0,
          persistenceCount: streakData.persistence_count || 0,
          topicsExplored: streakData.topics_explored || 0,
          totalSessions: streakData.total_sessions || 0,
        });
      }
    };

    loadData();
  }, [user]);

  const getProgress = (achievement: Achievement): number => {
    let current = 0;
    let target = achievement.requirement.value;

    switch (achievement.requirement.type) {
      case 'streak':
        current = stats.currentStreak;
        break;
      case 'consecutive-days':
        current = stats.consecutiveDays;
        break;
      case 'exam-ready-topics':
        current = stats.examReadyTopics;
        break;
      case 'persistence-count':
        current = stats.persistenceCount;
        break;
      case 'topics-explored':
        current = stats.topicsExplored;
        break;
      case 'total-sessions':
        current = stats.totalSessions;
        break;
    }

    return (current / target) * 100;
  };

  const categories = [
    { name: 'Streak', value: 'streak' as const },
    { name: 'Mastery', value: 'mastery' as const },
    { name: 'Persistence', value: 'persistence' as const },
    { name: 'Exploration', value: 'exploration' as const },
    { name: 'Speed', value: 'speed' as const },
  ];

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-bold mb-2">Achievements</h2>
        <p className="text-muted-foreground">
          Unlock badges by learning and practicing! {unlockedAchievements.length} of {ACHIEVEMENTS.length} unlocked
        </p>
      </div>

      {categories.map(category => {
        const categoryAchievements = ACHIEVEMENTS.filter(a => a.category === category.value);
        const unlockedCount = categoryAchievements.filter(a => 
          unlockedAchievements.includes(a.id)
        ).length;

        return (
          <div key={category.value}>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {category.name}
              <span className="text-sm text-muted-foreground">
                ({unlockedCount}/{categoryAchievements.length})
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categoryAchievements.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlockedAchievements.includes(achievement.id)}
                  progress={getProgress(achievement)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
