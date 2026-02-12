/**
 * Hint Ladder System
 * Provides progressive scaffolding for practice problems
 */

export type HintLevel =
  | 'conceptual' // High-level strategy hint
  | 'structural' // Problem structure/setup hint
  | 'procedural' // Specific step hint
  | 'near-complete'; // Almost the full solution

export interface Hint {
  level: HintLevel;
  content: string;
  prerequisite?: string; // What student should understand before this hint
}

export interface HintLadder {
  problemId: string;
  hints: Hint[];
  currentHintIndex: number;
}

/**
 * Hint ladder configuration for common question types
 * These guide the AI on what kind of hints to provide at each level
 */
export const HINT_LEVEL_TEMPLATES: Record<HintLevel, string> = {
  conceptual: `Provide a CONCEPTUAL hint that guides the overall approach:
- What type of problem is this?
- What's the general strategy or formula family?
- What's the first decision point?
Example: "What is the general form of the r-th term in a binomial expansion?"
DO NOT mention specific numbers or give away any calculation steps.`,

  structural: `Provide a STRUCTURAL hint about how to set up this specific problem:
- How should they organize the information?
- What are the key values to identify (n, r, coefficients, etc.)?
- What's the structure of the solution?
Example: "Here n = 5, so what is the highest power of x? How many terms will there be?"
DO NOT perform any calculations, just point out the structure.`,

  procedural: `Provide a PROCEDURAL hint for the next specific step:
- Write out the formula with variables identified
- Show how to start the calculation
- Guide them through one substep
Example: "Write the term with r = 2 explicitly using the formula, then simplify the factorial."
You may show ONE step worked out, but leave the rest for them.`,

  'near-complete': `Provide a NEAR-COMPLETE hint:
- Show the full setup and most of the working
- Leave only the final simplification for them
- This is essentially a worked example with the last step blank
Example: "The calculation gives us (10)(x²)(y³) = 10x²y³. Now simplify to match the required form."`,
};

/**
 * Generate hint system prompt for practice mode
 */
export function generateHintSystemPrompt(): string {
  return `## Hint System for Practice Mode

You have access to a **progressive hint ladder** when students need help:

**Hint Level 1 - Conceptual (Always start here):**
${HINT_LEVEL_TEMPLATES.conceptual}

**Hint Level 2 - Structural:**
${HINT_LEVEL_TEMPLATES.structural}

**Hint Level 3 - Procedural:**
${HINT_LEVEL_TEMPLATES.procedural}

**Hint Level 4 - Near-Complete (Only if student explicitly requests full help):**
${HINT_LEVEL_TEMPLATES['near-complete']}

### Rules for Hint Delivery:
1. **ALWAYS start with Level 1** when student first asks for help
2. **NEVER skip levels** - go through them progressively
3. **Wait for student to try** after each hint before giving the next level
4. **Ask them to attempt** the step after each hint: "Give that a try and show me what you get."
5. **Track hint level** in your responses (mention "Here's a conceptual hint..." or "Let's get a bit more specific...")
6. **Encourage independence**: "I think you can get this with one more hint - want to try first, or should I give you the next hint?"

### Student Controls (they can request):
- "Give me a hint" → Provide next hint level
- "I want a smaller step" → Add more granularity at current level
- "Skip this step" → Show this step fully, move to next
- "Just check my work" → Don't give hints, just verify their approach
`;
}

/**
 * Parse hint request type from user message
 */
export function parseHintRequest(userMessage: string): {
  type: 'hint' | 'smaller-step' | 'skip-step' | 'check-work' | 'none';
  explicit: boolean; // whether student explicitly requested or tutor inferred
} {
  const lower = userMessage.toLowerCase();

  if (lower.includes('hint')) {
    return { type: 'hint', explicit: true };
  }
  if (lower.includes('smaller step') || lower.includes('break it down')) {
    return { type: 'smaller-step', explicit: true };
  }
  if (lower.includes('skip') || lower.includes('show me this step')) {
    return { type: 'skip-step', explicit: true };
  }
  if (lower.includes('check') || lower.includes('is this right')) {
    return { type: 'check-work', explicit: true };
  }

  // Inference: if student seems stuck (short message, frustration words)
  const stuckIndicators = ['stuck', 'confused', 'i don\'t know', 'help', '?', 'idk'];
  if (stuckIndicators.some((ind) => lower.includes(ind))) {
    return { type: 'hint', explicit: false };
  }

  return { type: 'none', explicit: false };
}

/**
 * Common misconceptions for Edexcel A-Level topics
 * Tutor should recognize these patterns and provide targeted feedback
 */
export const COMMON_MISCONCEPTIONS: Record<string, string[]> = {
  'binomial-expansion': [
    'Confusing nCr with n^r',
    'Sign errors when dealing with negative terms',
    'Forgetting to simplify coefficients',
    'Wrong power arithmetic (n-r confused with r)',
  ],
  'differentiation': [
    'Forgetting chain rule when needed',
    'Product rule errors (only differentiating one factor)',
    'Sign errors with negative powers',
    'Confusing d/dx notation',
  ],
  'integration': [
    'Forgetting +C constant',
    'Incorrect reverse chain rule',
    'Sign errors with definite integrals',
    'Wrong power rule (n+1 vs n-1)',
  ],
  'trigonometry': [
    'Confusing sin²x + cos²x = 1 with tan²x + 1 = sec²x',
    'Sign errors in quadrants',
    'Degree/radian confusion',
    'Forgetting double-angle formulas',
  ],
  'probability': [
    'Adding rather than multiplying for independent events',
    'Forgetting to consider order vs no order',
    'Conditional probability confusion',
    'Not simplifying fractions',
  ],
  'vectors': [
    'Confusing vector addition with scalar multiplication',
    'Sign errors in direction',
    'Magnitude calculation errors',
    'Dot vs cross product confusion',
  ],
};

/**
 * Get likely misconceptions for a topic (for AI context)
 */
export function getMisconceptionsForTopic(subtopic: string): string[] {
  const normalized = subtopic.toLowerCase().replace(/[^a-z]/g, '-');
  
  for (const [key, misconceptions] of Object.entries(COMMON_MISCONCEPTIONS)) {
    if (normalized.includes(key) || key.includes(normalized.slice(0, 10))) {
      return misconceptions;
    }
  }
  
  return [];
}

/**
 * Generate misconception detection prompt
 */
export function generateMisconceptionPrompt(subtopic: string): string {
  const misconceptions = getMisconceptionsForTopic(subtopic);
  
  if (misconceptions.length === 0) return '';
  
  return `\n## Common Student Errors for ${subtopic}
Watch for these typical mistakes:
${misconceptions.map((m, i) => `${i + 1}. ${m}`).join('\n')}

If you detect one of these errors in the student's work, DON'T just say "wrong" - instead:
1. Ask a diagnostic question: "Are you treating this as...?"
2. Provide a micro-example that highlights the difference
3. Let them retry with the correction in mind`;
}
