/**
 * Mastery Tracking System
 * Track student progress through topics with granular mastery levels
 */

export type MasteryLevel =
  | 'not-started'
  | 'learning' // Seen the concept, worked through examples
  | 'practicing' // Solving problems with some success
  | 'comfortable' // Consistently solving problems correctly
  | 'exam-ready'; // Mastered exam-style questions under time pressure

export interface TopicMastery {
  topicId: string;
  subtopic: string;
  masteryLevel: MasteryLevel;
  attemptedProblems: number;
  correctProblems: number;
  hintsUsed: number;
  timeSpentSeconds: number;
  lastPracticedAt: string;
  examStyleAttempts: number;
  examStyleCorrect: number;
  commonMistakes: string[];
  strengthAreas: string[]; // Specific skills they're good at
}

/**
 * Calculate mastery level based on performance metrics
 */
export function calculateMasteryLevel(metrics: {
  attemptedProblems: number;
  correctProblems: number;
  hintsUsedRate: number; // 0-1
  recentAccuracy: number; // 0-1, last 5 problems
  examStyleSuccess: number; // 0-1
  hasSeenLesson: boolean;
}): MasteryLevel {
  const { attemptedProblems, correctProblems, hintsUsedRate, recentAccuracy, examStyleSuccess, hasSeenLesson } = metrics;

  // Not started
  if (!hasSeenLesson && attemptedProblems === 0) {
    return 'not-started';
  }

  // Learning phase: just started, or low accuracy
  if (attemptedProblems < 3 || correctProblems === 0) {
    return 'learning';
  }

  const overallAccuracy = correctProblems / attemptedProblems;

  // Practicing: moderate success, still using hints
  if (overallAccuracy < 0.7 || hintsUsedRate > 0.4 || attemptedProblems < 5) {
    return 'practicing';
  }

  // Comfortable: consistent success, less hint reliance
  if (overallAccuracy >= 0.7 && recentAccuracy >= 0.8 && hintsUsedRate <= 0.3) {
    // Check if exam-ready
    if (examStyleSuccess >= 0.75 && attemptedProblems >= 10) {
      return 'exam-ready';
    }
    return 'comfortable';
  }

  return 'practicing';
}

/**
 * Get recommendation based on mastery level
 */
export function getMasteryRecommendation(level: MasteryLevel, context: {
  topicName: string;
  subtopic: string;
  timeSpent: number;
}): string {
  const recommendations: Record<MasteryLevel, string> = {
    'not-started': `Start with the Explain mode to learn ${context.subtopic}. I'll walk you through the concept step-by-step.`,
    
    'learning': `You're making progress on ${context.subtopic}! Try a few more guided examples to build confidence. Hints are your friend right now!`,
    
    'practicing': `You're getting the hang of ${context.subtopic}! Keep practicing - aim for 3-5 correct problems in a row with minimal hints.`,
    
    'comfortable': `Great work on ${context.subtopic}! You're ready for exam-style questions. Try some past paper problems to test your speed and accuracy.`,
    
    'exam-ready': `🎉 ${context.subtopic} mastered! You're exam-ready. Consider: (1) Moving to related advanced topics, (2) Coming back in a week for spaced repetition, or (3) Helping peers with this topic!`,
  };

  return recommendations[level];
}

/**
 * Get mastery percentage for visual display (0-100)
 */
export function getMasteryPercentage(level: MasteryLevel): number {
  const percentages: Record<MasteryLevel, number> = {
    'not-started': 0,
    'learning': 20,
    'practicing': 45,
    'comfortable': 75,
    'exam-ready': 100,
  };
  return percentages[level];
}

/**
 * Get mastery color for UI
 */
export function getMasteryColor(level: MasteryLevel): string {
  const colors: Record<MasteryLevel, string> = {
    'not-started': 'text-muted-foreground',
    'learning': 'text-blue-500',
    'practicing': 'text-yellow-500',
    'comfortable': 'text-green-500',
    'exam-ready': 'text-purple-500',
  };
  return colors[level];
}

/**
 * Get mastery icon for UI
 */
export function getMasteryIcon(level: MasteryLevel): string {
  const icons: Record<MasteryLevel, string> = {
    'not-started': '○',
    'learning': '◔',
    'practicing': '◑',
    'comfortable': '◕',
    'exam-ready': '●',
  };
  return icons[level];
}

/**
 * Determine if topic needs review (spaced repetition)
 */
export function needsReview(mastery: TopicMastery): boolean {
  const daysSinceLastPractice = (Date.now() - new Date(mastery.lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24);
  
  // Fresher knowledge needs less frequent review
  const reviewIntervals: Record<MasteryLevel, number> = {
    'not-started': 0, // N/A
    'learning': 1, // Review next day
    'practicing': 3, // Review after 3 days
    'comfortable': 7, // Review after 1 week
    'exam-ready': 14, // Review after 2 weeks
  };

  return daysSinceLastPractice >= reviewIntervals[mastery.masteryLevel];
}

/**
 * Achievements based on mastery milestones
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

export function checkMasteryAchievements(masteries: TopicMastery[]): Achievement[] {
  const achievements: Achievement[] = [];

  const examReadyCount = masteries.filter((m) => m.masteryLevel === 'exam-ready').length;
  const comfortableCount = masteries.filter((m) => m.masteryLevel === 'comfortable').length;

  if (examReadyCount >= 1) {
    achievements.push({
      id: 'first-mastery',
      title: 'First Topic Mastered!',
      description: 'Achieved exam-ready status on your first topic',
      icon: '🎯',
      earnedAt: new Date().toISOString(),
    });
  }

  if (examReadyCount >= 5) {
    achievements.push({
      id: 'five-mastery',
      title: 'Pentamaster',
      description: 'Mastered 5 topics to exam-ready level',
      icon: '🌟',
      earnedAt: new Date().toISOString(),
    });
  }

  if (examReadyCount >= 10) {
    achievements.push({
      id: 'ten-mastery',
      title: 'Decamaster',
      description: 'Mastered 10 topics to exam-ready level',
      icon: '👑',
      earnedAt: new Date().toISOString(),
    });
  }

  if (comfortableCount + examReadyCount >= 20) {
    achievements.push({
      id: 'twenty-comfortable',
      title: 'Consistent Champion',
      description: 'Reached comfortable or exam-ready on 20 topics',
      icon: '🏆',
      earnedAt: new Date().toISOString(),
    });
  }

  // Check for good habits
  const hardWorkingCount = masteries.filter((m) => m.attemptedProblems >= 10).length;
  if (hardWorkingCount >= 5) {
    achievements.push({
      id: 'hard-worker',
      title: 'Practice Makes Perfect',
      description: 'Solved 10+ problems in 5 different topics',
      icon: '💪',
      earnedAt: new Date().toISOString(),
    });
  }

  const minimalHintsCount = masteries.filter(
    (m) => m.attemptedProblems >= 5 && m.hintsUsed / m.attemptedProblems < 0.2
  ).length;
  if (minimalHintsCount >= 3) {
    achievements.push({
      id: 'independent-learner',
      title: 'Independent Learner',
      description: 'Solved most problems without hints in 3 topics',
      icon: '🧠',
      earnedAt: new Date().toISOString(),
    });
  }

  return achievements;
}

/**
 * Generate study recommendations based on mastery map
 */
export function generateStudyRecommendations(masteries: TopicMastery[]): Array<{
  type: 'review' | 'continue' | 'start-new' | 'exam-practice';
  topicId: string;
  subtopic: string;
  reason: string;
  priority: number; // 1-5, higher = more important
}> {
  const recommendations: Array<{
    type: 'review' | 'continue' | 'start-new' | 'exam-practice';
    topicId: string;
    subtopic: string;
    reason: string;
    priority: number;
  }> = [];

  // Topics needing review (spaced repetition)
  masteries
    .filter((m) => needsReview(m) && m.masteryLevel !== 'not-started')
    .forEach((m) => {
      recommendations.push({
        type: 'review',
        topicId: m.topicId,
        subtopic: m.subtopic,
        reason: `Due for spaced repetition review (last practiced ${Math.floor((Date.now() - new Date(m.lastPracticedAt).getTime()) / (1000 * 60 * 60 * 24))} days ago)`,
        priority: m.masteryLevel === 'exam-ready' ? 3 : 4,
      });
    });

  // Continue topics in progress
  masteries
    .filter((m) => m.masteryLevel === 'learning' || m.masteryLevel === 'practicing')
    .forEach((m) => {
      recommendations.push({
        type: 'continue',
        topicId: m.topicId,
        subtopic: m.subtopic,
        reason: `Currently ${m.masteryLevel} - keep building momentum!`,
        priority: 5,
      });
    });

  // Exam practice for comfortable topics
  masteries
    .filter((m) => m.masteryLevel === 'comfortable' && m.examStyleAttempts < 3)
    .forEach((m) => {
      recommendations.push({
        type: 'exam-practice',
        topicId: m.topicId,
        subtopic: m.subtopic,
        reason: 'Ready for exam-style questions to reach mastery',
        priority: 4,
      });
    });

  // Sort by priority (descending) and return top 5
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
