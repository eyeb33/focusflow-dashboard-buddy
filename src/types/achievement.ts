/**
 * Achievement Badge System
 * Gamification through unlockable achievements
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: 'streak' | 'mastery' | 'persistence' | 'exploration' | 'speed';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: {
    type: string;
    value: number;
  };
  unlockedAt?: Date;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak Achievements
  {
    id: 'streak-3',
    name: 'Getting Started',
    description: 'Answered 3 problems correctly in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    requirement: { type: 'streak', value: 3 },
  },
  {
    id: 'streak-5',
    name: 'On Fire',
    description: 'Answered 5 problems correctly in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'silver',
    requirement: { type: 'streak', value: 5 },
  },
  {
    id: 'streak-10',
    name: 'Unstoppable',
    description: 'Answered 10 problems correctly in a row',
    icon: '🔥',
    category: 'streak',
    tier: 'gold',
    requirement: { type: 'streak', value: 10 },
  },
  {
    id: 'streak-20',
    name: 'Math Wizard',
    description: 'Answered 20 problems correctly in a row',
    icon: '🧙‍♂️',
    category: 'streak',
    tier: 'platinum',
    requirement: { type: 'streak', value: 20 },
  },

  // Daily Streak Achievements
  {
    id: 'daily-3',
    name: 'Consistent Learner',
    description: 'Studied 3 days in a row',
    icon: '📅',
    category: 'streak',
    tier: 'bronze',
    requirement: { type: 'consecutive-days', value: 3 },
  },
  {
    id: 'daily-7',
    name: 'Week Warrior',
    description: 'Studied 7 days in a row',
    icon: '📅',
    category: 'streak',
    tier: 'silver',
    requirement: { type: 'consecutive-days', value: 7 },
  },
  {
    id: 'daily-14',
    name: 'Two Week Champion',
    description: 'Studied 14 days in a row',
    icon: '🏆',
    category: 'streak',
    tier: 'gold',
    requirement: { type: 'consecutive-days', value: 14 },
  },
  {
    id: 'daily-30',
    name: 'Monthly Master',
    description: 'Studied 30 days in a row',
    icon: '👑',
    category: 'streak',
    tier: 'platinum',
    requirement: { type: 'consecutive-days', value: 30 },
  },

  // Mastery Achievements
  {
    id: 'mastery-1',
    name: 'First Steps',
    description: 'Reached "Exam Ready" in 1 topic',
    icon: '⭐',
    category: 'mastery',
    tier: 'bronze',
    requirement: { type: 'exam-ready-topics', value: 1 },
  },
  {
    id: 'mastery-3',
    name: 'Expert Emerging',
    description: 'Reached "Exam Ready" in 3 topics',
    icon: '⭐⭐',
    category: 'mastery',
    tier: 'silver',
    requirement: { type: 'exam-ready-topics', value: 3 },
  },
  {
    id: 'mastery-5',
    name: 'Topic Master',
    description: 'Reached "Exam Ready" in 5 topics',
    icon: '⭐⭐⭐',
    category: 'mastery',
    tier: 'gold',
    requirement: { type: 'exam-ready-topics', value: 5 },
  },
  {
    id: 'mastery-10',
    name: 'A-Level Legend',
    description: 'Reached "Exam Ready" in 10 topics',
    icon: '🎓',
    category: 'mastery',
    tier: 'platinum',
    requirement: { type: 'exam-ready-topics', value: 10 },
  },

  // Persistence Achievements
  {
    id: 'persist-10',
    name: 'Never Give Up',
    description: 'Attempted 10 problems after making mistakes',
    icon: '💪',
    category: 'persistence',
    tier: 'bronze',
    requirement: { type: 'persistence-count', value: 10 },
  },
  {
    id: 'persist-25',
    name: 'Resilience',
    description: 'Attempted 25 problems after making mistakes',
    icon: '💪',
    category: 'persistence',
    tier: 'silver',
    requirement: { type: 'persistence-count', value: 25 },
  },
  {
    id: 'persist-50',
    name: 'Iron Will',
    description: 'Attempted 50 problems after making mistakes',
    icon: '🛡️',
    category: 'persistence',
    tier: 'gold',
    requirement: { type: 'persistence-count', value: 50 },
  },

  // Exploration Achievements
  {
    id: 'topics-5',
    name: 'Curious Mind',
    description: 'Explored 5 different topics',
    icon: '🔍',
    category: 'exploration',
    tier: 'bronze',
    requirement: { type: 'topics-explored', value: 5 },
  },
  {
    id: 'topics-10',
    name: 'Wide Learning',
    description: 'Explored 10 different topics',
    icon: '📚',
    category: 'exploration',
    tier: 'silver',
    requirement: { type: 'topics-explored', value: 10 },
  },
  {
    id: 'topics-15',
    name: 'Math Explorer',
    description: 'Explored 15 different topics',
    icon: '🗺️',
    category: 'exploration',
    tier: 'gold',
    requirement: { type: 'topics-explored', value: 15 },
  },

  // Speed Achievements
  {
    id: 'sessions-10',
    name: 'Dedicated Learner',
    description: 'Completed 10 study sessions',
    icon: '⚡',
    category: 'speed',
    tier: 'bronze',
    requirement: { type: 'total-sessions', value: 10 },
  },
  {
    id: 'sessions-25',
    name: 'Study Enthusiast',
    description: 'Completed 25 study sessions',
    icon: '⚡⚡',
    category: 'speed',
    tier: 'silver',
    requirement: { type: 'total-sessions', value: 25 },
  },
  {
    id: 'sessions-50',
    name: 'Learning Machine',
    description: 'Completed 50 study sessions',
    icon: '🚀',
    category: 'speed',
    tier: 'gold',
    requirement: { type: 'total-sessions', value: 50 },
  },
  {
    id: 'sessions-100',
    name: 'Ultimate Dedication',
    description: 'Completed 100 study sessions',
    icon: '🌟',
    category: 'speed',
    tier: 'platinum',
    requirement: { type: 'total-sessions', value: 100 },
  },
];

/**
 * Check which achievements should be unlocked based on current stats
 */
export function checkAchievements(stats: {
  currentStreak?: number;
  consecutiveDays?: number;
  examReadyTopics?: number;
  persistenceCount?: number;
  topicsExplored?: number;
  totalSessions?: number;
  unlockedAchievements?: string[];
}): Achievement[] {
  const unlocked = stats.unlockedAchievements || [];
  const newAchievements: Achievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    if (unlocked.includes(achievement.id)) continue;

    let meetsRequirement = false;

    switch (achievement.requirement.type) {
      case 'streak':
        meetsRequirement = (stats.currentStreak || 0) >= achievement.requirement.value;
        break;
      case 'consecutive-days':
        meetsRequirement = (stats.consecutiveDays || 0) >= achievement.requirement.value;
        break;
      case 'exam-ready-topics':
        meetsRequirement = (stats.examReadyTopics || 0) >= achievement.requirement.value;
        break;
      case 'persistence-count':
        meetsRequirement = (stats.persistenceCount || 0) >= achievement.requirement.value;
        break;
      case 'topics-explored':
        meetsRequirement = (stats.topicsExplored || 0) >= achievement.requirement.value;
        break;
      case 'total-sessions':
        meetsRequirement = (stats.totalSessions || 0) >= achievement.requirement.value;
        break;
    }

    if (meetsRequirement) {
      newAchievements.push({
        ...achievement,
        unlockedAt: new Date(),
      });
    }
  }

  return newAchievements;
}

/**
 * Get tier color for display
 */
export function getTierColor(tier: Achievement['tier']): string {
  switch (tier) {
    case 'bronze':
      return 'text-amber-700 dark:text-amber-400';
    case 'silver':
      return 'text-gray-500 dark:text-gray-300';
    case 'gold':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'platinum':
      return 'text-purple-500 dark:text-purple-400';
  }
}

/**
 * Get tier background color for display
 */
export function getTierBgColor(tier: Achievement['tier']): string {
  switch (tier) {
    case 'bronze':
      return 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600';
    case 'silver':
      return 'bg-gray-100 dark:bg-gray-800/20 border-gray-300 dark:border-gray-600';
    case 'gold':
      return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600';
    case 'platinum':
      return 'bg-purple-100 dark:bg-purple-900/20 border-purple-300 dark:border-purple-600';
  }
}
