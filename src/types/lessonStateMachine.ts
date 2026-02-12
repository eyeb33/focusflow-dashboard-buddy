/**
 * Lesson State Machine
 * Turns "Explain" mode into structured micro-lessons with defined stages
 */

export type LessonStage =
  | 'LESSON_INTRO'
  | 'PRIOR_KNOWLEDGE_CHECK'
  | 'CONCEPT_OVERVIEW'
  | 'EXAMPLE_TUTOR_DEMO'
  | 'EXAMPLE_GUIDED'
  | 'EXAMPLE_INDEPENDENT'
  | 'QUICK_CHECK'
  | 'REMEDIAL' // Branch for misconceptions
  | 'SUMMARY'
  | 'NEXT_STEPS';

export interface LessonState {
  currentStage: LessonStage;
  topicId: string;
  subtopic: string;
  priorKnowledgeLevel?: 'never' | 'a-bit' | 'confident';
  mistakesMade: string[]; // Track misconceptions to address
  checksCompleted: number;
  checksTotal: number;
  timeSpentSeconds: number;
}

export interface LessonStageConfig {
  stage: LessonStage;
  title: string;
  objective: string;
  tutorPrompt: string; // What the AI should do in this stage
  userActions: string[]; // What student should do
  transitionConditions: {
    next: LessonStage;
    condition?: string; // Optional: condition for branching
  }[];
  estimatedDuration: number; // seconds
}

/**
 * Default lesson flow for any topic
 */
export const DEFAULT_LESSON_FLOW: LessonStageConfig[] = [
  {
    stage: 'LESSON_INTRO',
    title: 'Introduction',
    objective: 'Set expectations and goals for this lesson',
    tutorPrompt: 'Welcome student to the topic. Briefly state what they will learn (1-2 sentences). Ask if they have any existing familiarity with the topic.',
    userActions: ['Read objective', 'Indicate familiarity level'],
    transitionConditions: [{ next: 'PRIOR_KNOWLEDGE_CHECK' }],
    estimatedDuration: 30,
  },
  {
    stage: 'PRIOR_KNOWLEDGE_CHECK',
    title: 'Prior Knowledge',
    objective: 'Assess what student already knows',
    tutorPrompt: 'Ask 1-2 quick questions about prerequisite concepts (e.g., for integration by parts, check if they know product rule). Adjust difficulty based on their answers.',
    userActions: ['Answer quick diagnostic questions'],
    transitionConditions: [{ next: 'CONCEPT_OVERVIEW' }],
    estimatedDuration: 90,
  },
  {
    stage: 'CONCEPT_OVERVIEW',
    title: 'Big Picture',
    objective: 'Understand the concept visually and intuitively',
    tutorPrompt: 'Present ONE key visual or pattern (e.g., triangle of coefficients for binomial). Give a single-sentence definition. Emphasize intuition over rigor.',
    userActions: ['Understand the visual pattern', 'Ask clarifying questions'],
    transitionConditions: [{ next: 'EXAMPLE_TUTOR_DEMO' }],
    estimatedDuration: 120,
  },
  {
    stage: 'EXAMPLE_TUTOR_DEMO',
    title: 'I Do (Worked Example)',
    objective: 'Watch tutor solve a simple problem with full explanation',
    tutorPrompt: 'Work through a straightforward example step-by-step. Narrate your reasoning aloud, not just algebra. Highlight why each step matters.',
    userActions: ['Follow along', 'Note the method'],
    transitionConditions: [{ next: 'EXAMPLE_GUIDED' }],
    estimatedDuration: 180,
  },
  {
    stage: 'EXAMPLE_GUIDED',
    title: 'We Do (Guided Practice)',
    objective: 'Solve together with student filling in key steps',
    tutorPrompt: 'Present a similar problem. Complete the first step yourself, then ask student to do the next key step. Alternate until complete. Provide hints if stuck.',
    userActions: ['Fill in blanks', 'Attempt steps with guidance'],
    transitionConditions: [
      { next: 'REMEDIAL', condition: 'student makes significant error' },
      { next: 'EXAMPLE_INDEPENDENT' },
    ],
    estimatedDuration: 240,
  },
  {
    stage: 'EXAMPLE_INDEPENDENT',
    title: 'You Do (Independent Practice)',
    objective: 'Student solves problem independently with minimal hints',
    tutorPrompt: 'Present a very similar problem. Wait for student to attempt it fully. Only provide small hints if they explicitly ask or are stuck for 60+ seconds.',
    userActions: ['Solve independently', 'Show full working'],
    transitionConditions: [
      { next: 'REMEDIAL', condition: 'student makes conceptual error' },
      { next: 'QUICK_CHECK' },
    ],
    estimatedDuration: 300,
  },
  {
    stage: 'REMEDIAL',
    title: 'Address Misconception',
    objective: 'Fix specific misunderstanding before continuing',
    tutorPrompt: 'Identify the exact misconception. Give a mini-explanation or analogy targeted at that specific error. Provide one micro-problem that tests just that concept.',
    userActions: ['Understand the correction', 'Retry the problematic step'],
    transitionConditions: [
      { next: 'EXAMPLE_INDEPENDENT', condition: 'after fixing error' },
      { next: 'QUICK_CHECK', condition: 'error was minor' },
    ],
    estimatedDuration: 180,
  },
  {
    stage: 'QUICK_CHECK',
    title: 'Quick Check',
    objective: 'Verify understanding with targeted questions',
    tutorPrompt: 'Ask 2-3 MCQ or short-answer questions targeting common mistakes for this topic (e.g., sign errors, wrong power). Explain why wrong answers are tempting.',
    userActions: ['Answer check questions', 'Review missed concepts'],
    transitionConditions: [
      { next: 'REMEDIAL', condition: 'student misses 2+ questions' },
      { next: 'SUMMARY' },
    ],
    estimatedDuration: 120,
  },
  {
    stage: 'SUMMARY',
    title: 'Summary & Reflection',
    objective: 'Consolidate learning and build metacognition',
    tutorPrompt: 'List 2-3 key takeaways from this lesson. Ask student: "What was the trickiest part?" Affirm their progress specifically.',
    userActions: ['Reflect on what they learned', 'Note difficult areas'],
    transitionConditions: [{ next: 'NEXT_STEPS' }],
    estimatedDuration: 90,
  },
  {
    stage: 'NEXT_STEPS',
    title: 'What\'s Next',
    objective: 'Direct student to next action',
    tutorPrompt: 'Suggest: (1) Try practice problems on same topic, (2) Move to related advanced topic, or (3) Take a break. Make it actionable.',
    userActions: ['Choose next action'],
    transitionConditions: [], // End of lesson
    estimatedDuration: 30,
  },
];

/**
 * Get the next stage based on current state and conditions
 */
export function getNextStage(
  currentStage: LessonStage,
  condition?: string
): LessonStage | null {
  const stageConfig = DEFAULT_LESSON_FLOW.find((s) => s.stage === currentStage);
  if (!stageConfig || stageConfig.transitionConditions.length === 0) {
    return null; // Lesson complete
  }

  // If a condition is provided, find matching transition
  if (condition) {
    const matchingTransition = stageConfig.transitionConditions.find(
      (t) => t.condition?.toLowerCase().includes(condition.toLowerCase())
    );
    if (matchingTransition) {
      return matchingTransition.next;
    }
  }

  // Default to first transition without condition or first overall
  const defaultTransition = stageConfig.transitionConditions.find((t) => !t.condition)
    || stageConfig.transitionConditions[0];
  
  return defaultTransition.next;
}

/**
 * Calculate lesson progress (0-100)
 */
export function calculateLessonProgress(currentStage: LessonStage): number {
  const stageIndex = DEFAULT_LESSON_FLOW.findIndex((s) => s.stage === currentStage);
  if (stageIndex === -1) return 0;
  return Math.round((stageIndex / (DEFAULT_LESSON_FLOW.length - 1)) * 100);
}

/**
 * Get total estimated lesson duration
 */
export function getEstimatedLessonDuration(): number {
  return DEFAULT_LESSON_FLOW.reduce((total, stage) => total + stage.estimatedDuration, 0);
}

/**
 * Format stage prompt for AI with current context
 */
export function formatStagePromptForAI(
  stage: LessonStage,
  context: {
    topicName: string;
    subtopic?: string;
    priorKnowledgeLevel?: string;
    recentErrors?: string[];
  }
): string {
  const stageConfig = DEFAULT_LESSON_FLOW.find((s) => s.stage === stage);
  if (!stageConfig) return '';

  let prompt = `## Current Lesson Stage: ${stageConfig.title}
**Objective:** ${stageConfig.objective}
**Your role right now:** ${stageConfig.tutorPrompt}

**Topic Context:** ${context.topicName}${context.subtopic ? ` → ${context.subtopic}` : ''}
`;

  if (context.priorKnowledgeLevel) {
    prompt += `\n**Student's prior knowledge:** ${context.priorKnowledgeLevel}`;
  }

  if (context.recentErrors && context.recentErrors.length > 0) {
    prompt += `\n**Recent mistakes:** ${context.recentErrors.join(', ')}\n(Address these if relevant to current stage)`;
  }

  return prompt;
}
