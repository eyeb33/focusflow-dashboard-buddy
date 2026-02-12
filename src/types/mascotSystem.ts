/**
 * Mascot System
 * Adds personality and gamification through a robot study buddy
 */

export type MascotState =
  | 'idle'
  | 'thinking'
  | 'excited'
  | 'encouraging'
  | 'confused'
  | 'celebrating';

export interface MascotReaction {
  state: MascotState;
  message?: string;
  duration?: number; // milliseconds
}

export const MASCOT_REACTIONS: Record<string, MascotReaction> = {
  // Study session events
  sessionStart: {
    state: 'excited',
    message: 'Let\'s learn something amazing today!',
    duration: 3000,
  },
  sessionComplete: {
    state: 'celebrating',
    message: 'Great focus! You crushed that session! 🎉',
    duration: 4000,
  },
  
  // Learning progress
  firstCorrectAnswer: {
    state: 'excited',
    message: 'Brilliant start! You\'ve got this! ✨',
    duration: 3000,
  },
  streakThree: {
    state: 'celebrating',
    message: 'Three in a row! You\'re on fire! 🔥',
    duration: 3000,
  },
  streakFive: {
    state: 'celebrating',
    message: 'FIVE correct! Are you a maths wizard? 🧙‍♂️',
    duration: 4000,
  },
  
  // Persistence
  persistAfterMistake: {
    state: 'encouraging',
    message: 'Love the persistence! That\'s how champions learn! 💪',
    duration: 3000,
  },
  usedHintWisely: {
    state: 'excited',
    message: 'Smart move asking for a hint! That\'s strategic learning! 🎯',
    duration: 3000,
  },
  
  // Topic mastery
  subtopicComplete: {
    state: 'celebrating',
    message: 'Subtopic mastered! You\'re making real progress! ⭐',
    duration: 4000,
  },
  topicComplete: {
    state: 'celebrating',
    message: 'TOPIC COMPLETE! You\'re unstoppable! 🏆',
    duration: 5000,
  },
  
  // Exam readiness
  examStyleCorrect: {
    state: 'celebrating',
    message: 'Nailed that exam-style question! Exam ready! 📝✨',
    duration: 4000,
  },
  
  // Negative events (encouragement)
  mistakeMade: {
    state: 'encouraging',
    message: 'Mistakes help us learn! Let\'s figure this out together. 🤔',
    duration: 3000,
  },
  studentStuck: {
    state: 'thinking',
    message: 'Hmm, let me help you think through this...',
    duration: 2000,
  },
};

/**
 * Mascot personality traits
 */
export const MASCOT_PERSONALITY = {
  name: 'MathBot',
  traits: [
    'Enthusiastic about maths (especially elegant solutions)',
    'Supportive but never patronizing',
    'Uses emojis sparingly but effectively',
    'Celebrates effort as much as success',
    'Gets excited about "aha moments"',
  ],
  catchphrases: [
    'Let\'s crack this!',
    'Math is beautiful!',
    'That\'s some clever thinking!',
    'I love how you approached that!',
    'Your brain is leveling up!',
  ],
};

/**
 * Determine which mascot reaction to trigger based on event
 */
export function getMascotReaction(event: {
  type: 'correct' | 'incorrect' | 'hint-used' | 'persist' | 'complete' | 'stuck';
  context?: {
    streakCount?: number;
    topicComplete?: boolean;
    subtopicComplete?: boolean;
    isExamStyle?: boolean;
    attemptsOnSameProblem?: number;
  };
}): MascotReaction | null {
  const { type, context } = event;

  switch (type) {
    case 'correct':
      if (context?.isExamStyle) {
        return MASCOT_REACTIONS.examStyleCorrect;
      }
      if (context?.streakCount === 1) {
        return MASCOT_REACTIONS.firstCorrectAnswer;
      }
      if (context?.streakCount === 3) {
        return MASCOT_REACTIONS.streakThree;
      }
      if (context?.streakCount && context.streakCount >= 5) {
        return MASCOT_REACTIONS.streakFive;
      }
      return null; // No reaction for regular correct answers

    case 'incorrect':
      if (context?.attemptsOnSameProblem && context.attemptsOnSameProblem >= 2) {
        return MASCOT_REACTIONS.persistAfterMistake;
      }
      return MASCOT_REACTIONS.mistakeMade;

    case 'hint-used':
      return MASCOT_REACTIONS.usedHintWisely;

    case 'persist':
      return MASCOT_REACTIONS.persistAfterMistake;

    case 'complete':
      if (context?.topicComplete) {
        return MASCOT_REACTIONS.topicComplete;
      }
      if (context?.subtopicComplete) {
        return MASCOT_REACTIONS.subtopicComplete;
      }
      return MASCOT_REACTIONS.sessionComplete;

    case 'stuck':
      return MASCOT_REACTIONS.studentStuck;

    default:
      return null;
  }
}

/**
 * Mascot encouragement based on study patterns
 */
export function getMascotEncouragement(pattern: {
  consecutiveDays?: number;
  sessionsToday?: number;
  topicsExplored?: number;
  showingWorkRate?: number; // percentage of solutions with working shown
}): string | null {
  if (pattern.consecutiveDays && pattern.consecutiveDays >= 7) {
    return '7-day streak! Your consistency is incredible! 🌟';
  }
  
  if (pattern.consecutiveDays && pattern.consecutiveDays >= 3) {
    return `${pattern.consecutiveDays} days in a row! Building great habits! 📈`;
  }

  if (pattern.sessionsToday && pattern.sessionsToday >= 3) {
    return 'Three sessions today - what dedication! 💪';
  }

  if (pattern.topicsExplored && pattern.topicsExplored >= 2) {
    return `You've improved in ${pattern.topicsExplored} topics this week! 🎯`;
  }

  if (pattern.showingWorkRate && pattern.showingWorkRate >= 80) {
    return 'Love how you always show your working - exam markers will too! ✍️';
  }

  return null;
}

/**
 * Mascot tips based on student behavior
 */
export function getMascotTip(behavior: {
  rushingThroughProblems?: boolean;
  avoidingDifficultTopics?: boolean;
  notUsingHints?: boolean;
  perfectStudySessions?: number;
}): string | null {
  if (behavior.rushingThroughProblems) {
    return 'Tip: Taking time to think deeply helps you remember better! Quality over speed! 🤔';
  }

  if (behavior.avoidingDifficultTopics) {
    return 'Tip: Tackling tough topics makes the biggest difference! Want to try one together? 💪';
  }

  if (behavior.notUsingHints) {
    return 'Tip: Asking for hints is smart, not cheating! It\'s how you learn efficiently! 💡';
  }

  if (behavior.perfectStudySessions && behavior.perfectStudySessions >= 5) {
    return "Wow! Try some harder problems - you're ready for a challenge! 🚀";
  }

  return null;
}
