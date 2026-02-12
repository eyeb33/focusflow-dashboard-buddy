# 🎓 Enhanced Tutor Implementation Guide

## ✅ What We've Built: Core Systems

You now have a complete pedagogical framework to transform your math tutor from "chatbot in a shell" to a real teaching experience.

### New Type Systems Created:

1. **`src/types/tutorPersona.ts`** - Defines tutor personality, teaching habits, and constraints
2. **`src/types/lessonStateMachine.ts`** - Structured lesson flow (Intro → Examples → Practice → Summary)
3. **`src/types/hintSystem.ts`** - Progressive scaffolding (Conceptual → Structural → Procedural)
4. **`src/types/mascotSystem.ts`** - Gamification reactions and encouragement
5. **`src/types/masteryTracking.ts`** - Granular progress tracking (Not Started → Exam Ready)
6. **`supabase/functions/ai-coach/enhancedPrompts.ts`** - New prompt builder integrating all systems

---

## 🚀 Implementation Roadmap

### Phase 1: IMMEDIATE IMPROVEMENTS (High Impact, Low Effort)

#### 1.1 Update AI Prompts ⚡ **DO THIS FIRST**

**File**: `supabase/functions/ai-coach/index.ts`

**Line ~1**: Add import:
```typescript
import buildEnhancedSystemPrompt from './enhancedPrompts.ts';
```

**Line ~295-430**: Replace the entire `systemPrompt` construction with:

```typescript
// Build enhanced system prompt with persona and pedagogical structure
let systemPrompt = buildEnhancedSystemPrompt({
  mode: mode as 'explain' | 'practice' | 'upload',
  activeTopic: activeTopic ? {
    name: activeTopic.name,
    activeSubtopic: activeTopic.activeSubtopic,
    subtopics: activeTopic.subtopics,
    completedSubtopics: activeTopic.completedSubtopics,
  } : undefined,
  sessionContext: {
    completedToday,
    focusTimeToday,
  },
  ragContext,
  isPracticeAutoQuestion,
});

// Add legacy task management context if needed
const activeTask = taskState?.tasks?.find((t: any) => t.is_active);
if (!activeTopic && taskState && taskState.tasks?.length > 0) {
  systemPrompt += `\n\nStudy Topics (can be managed via tools):
${taskState.tasks.map((t: any, i: number) => {
  let topicInfo = (i + 1) + '. "' + t.name + '" → ID: ' + t.id + (t.is_active ? ' (CURRENT)' : '');
  if (t.sub_tasks && t.sub_tasks.length > 0) {
    topicInfo += ' [' + t.sub_tasks.filter((st: any) => st.completed).length + '/' + t.sub_tasks.length + ' complete]';
  }
  return topicInfo;
}).join('\n')}`;
} else if (!activeTopic && activeTask) {
  systemPrompt += `\n\n📚 CURRENT STUDY TOPIC: "${activeTask.name}"`;
}

if (timerState) {
  systemPrompt += `\n\nStudy Timer: ${timerState.isRunning ? 'Running' : 'Paused'} - ${Math.floor(timerState.timeRemaining / 60)}m ${timerState.timeRemaining % 60}s remaining`;
}

// Add trigger context
if (trigger === 'pomodoro_cycle_complete') {
  systemPrompt += `\n\nStudent just completed a study cycle - congratulate and suggest review or break.`;
} else if (trigger === 'task_completed') {
  systemPrompt += `\n\nStudent completed topic "${triggerContext?.taskName}" - celebrate and suggest next steps.`;
} else if (trigger === 'first_interaction') {
  systemPrompt += `\n\nFirst interaction - welcome warmly and ask what they'd like help with.`;
}

systemPrompt += `\n\n## Available Tools
- get_tasks(), add_task(name), complete_task(task_id), delete_task(task_id)
- add_subtask(parent_task_id, name), toggle_subtask(subtask_id)
- start_timer(), pause_timer(), set_active_task(task_id)`;
```

**Impact**: Immediately improves tutor personality, hint scaffolding, and error handling. **No database changes needed**.

**Testing**: 
1. Start the dev server: `npm run dev`
2. Ask the tutor a question - notice more scaffolded, persona-driven responses
3. Try practice mode - observe progressive hints

---

#### 1.2 Add Simple Mascot Reactions 🤖

**File**: `src/components/Tutor/MathsTutorInterface.tsx`

**Import at top**:
```typescript
import { getMascotReaction, MascotReaction } from '@/types/mascotSystem';
```

**Add state** (around line ~220):
```typescript
const [mascotReaction, setMascotReaction] = useState<MascotReaction | null>(null);
const [streakCount, setStreakCount] = useState(0);
```

**After successful problem solve** (in message handling logic):
```typescript
// Detect correct answer (you'll need logic to determine this)
if (isCorrectAnswer) {
  setStreakCount(prev => prev + 1);
  const reaction = getMascotReaction({
    type: 'correct',
    context: { streakCount: streakCount + 1 }
  });
  if (reaction) {
    setMascotReaction(reaction);
    setTimeout(() => setMascotReaction(null), reaction.duration || 3000);
  }
}
```

**Display reaction** (add above messages area):
```tsx
{mascotReaction && (
  <div className="mx-4 mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-bottom-2">
    <p className="text-sm font-medium text-primary flex items-center gap-2">
      <span className="text-lg">🤖</span>
      {mascotReaction.message}
    </p>
  </div>
)}
```

**Impact**: Adds encouragement and personality without major UI overhaul.

---

### Phase 2: MASTERY TRACKING (Medium Effort, High Value)

#### 2.1 Database Schema for Mastery

Create new migration: `supabase/migrations/YYYYMMDD_add_mastery_tracking.sql`

```sql
-- Add mastery tracking columns to topic_sessions
ALTER TABLE topic_sessions
ADD COLUMN IF NOT EXISTS attempted_problems INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_problems INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_style_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_style_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mastery_level TEXT DEFAULT 'not-started',
ADD COLUMN IF NOT EXISTS common_mistakes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS strength_areas JSONB DEFAULT '[]'::jsonb;

-- Create index on mastery level for quick queries
CREATE INDEX IF NOT EXISTS idx_topic_sessions_mastery 
ON topic_sessions(user_id, mastery_level);
```

#### 2.2 Update Frontend to Track Mastery

**File**: `src/hooks/useCurriculumTopics.ts`

Add mutation to update mastery after each problem:

```typescript
const updateTopicMastery = async (
  topicId: string,
  subtopic: string,
  metrics: {
    wasCorrect: boolean;
    hintsUsed: number;
    isExamStyle?: boolean;
  }
) => {
  const session = await supabase
    .from('topic_sessions')
    .select('*')
    .eq('user_id', user?.id)
    .eq('topic_id', topicId)
    .single();

  if (!session.data) return;

  const updated = {
    attempted_problems: (session.data.attempted_problems || 0) + 1,
    correct_problems: metrics.wasCorrect
      ? (session.data.correct_problems || 0) + 1
      : session.data.correct_problems,
    hints_used: (session.data.hints_used || 0) + metrics.hintsUsed,
    ...(metrics.isExamStyle && {
      exam_style_attempts: (session.data.exam_style_attempts || 0) + 1,
      exam_style_correct: metrics.wasCorrect
        ? (session.data.exam_style_correct || 0) + 1
        : session.data.exam_style_correct,
    }),
  };

  // Calculate new mastery level
  const masteryLevel = calculateMasteryLevel({
    attemptedProblems: updated.attempted_problems,
    correctProblems: updated.correct_problems,
    hintsUsedRate: updated.hints_used / updated.attempted_problems,
    recentAccuracy: metrics.wasCorrect ? 1 : 0, // Simplified
    examStyleSuccess: updated.exam_style_correct / (updated.exam_style_attempts || 1),
    hasSeenLesson: session.data.message_count > 0,
  });

  await supabase
    .from('topic_sessions')
    .update({ ...updated, mastery_level: masteryLevel })
    .eq('id', session.data.id);
};
```

Import the `calculateMasteryLevel` function from `@/types/masteryTracking`.

#### 2.3 Display Mastery in UI

**File**: `src/components/Curriculum/CurriculumTopicList.tsx`

Add mastery indicator next to each subtopic:

```tsx
import { getMasteryIcon, getMasteryColor, getMasteryPercentage } from '@/types/masteryTracking';

// In subtopic rendering:
<div className="flex items-center gap-2">
  <span className={cn("text-lg", getMasteryColor(subtopic.masteryLevel))}>
    {getMasteryIcon(subtopic.masteryLevel)}
  </span>
  <span>{subtopic.name}</span>
  {subtopic.masteryLevel !== 'not-started' && (
    <span className="text-xs text-muted-foreground">
      {getMasteryPercentage(subtopic.masteryLevel)}%
    </span>
  )}
</div>
```

---

### Phase 3: LESSON STATE MACHINE (Higher Effort, Transformative)

#### 3.1 Database Schema for Lesson States

```sql
CREATE TABLE IF NOT EXISTS lesson_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  current_stage TEXT NOT NULL, -- 'LESSON_INTRO', 'PRIOR_KNOWLEDGE_CHECK', etc.
  prior_knowledge_level TEXT, -- 'never', 'a-bit', 'confident'
  mistakes_made JSONB DEFAULT '[]'::jsonb,
  checks_completed INTEGER DEFAULT 0,
  checks_total INTEGER DEFAULT 3,
  time_spent_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lesson_states_user_topic 
ON lesson_states(user_id, topic_id, subtopic);
```

#### 3.2 Lesson State Context

**File**: `src/contexts/LessonStateContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import {
  LessonState,
  LessonStage,
  getNextStage,
  calculateLessonProgress,
  formatStagePromptForAI,
} from '@/types/lessonStateMachine';

interface LessonStateContextType {
  currentLesson: LessonState | null;
  startLesson: (topicId: string, subtopic: string) => Promise<void>;
  advanceStage: (condition?: string) => Promise<void>;
  updatePriorKnowledge: (level: 'never' | 'a-bit' | 'confident') => Promise<void>;
  recordMistake: (mistake: string) => Promise<void>;
  getStagePrompt: () => string;
  lessonProgress: number;
}

const LessonStateContext = createContext<LessonStateContextType | undefined>(undefined);

export const LessonStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentLesson, setCurrentLesson] = useState<LessonState | null>(null);

  const startLesson = useCallback(async (topicId: string, subtopic: string) => {
    if (!user) return;

    const newLesson: LessonState = {
      currentStage: 'LESSON_INTRO',
      topicId,
      subtopic,
      mistakesMade: [],
      checksCompleted: 0,
      checksTotal: 3,
      timeSpentSeconds: 0,
    };

    await supabase.from('lesson_states').insert({
      user_id: user.id,
      topic_id: topicId,
      subtopic,
      current_stage: newLesson.currentStage,
    });

    setCurrentLesson(newLesson);
  }, [user]);

  const advanceStage = useCallback(async (condition?: string) => {
    if (!currentLesson) return;

    const nextStage = getNextStage(currentLesson.currentStage, condition);
    if (!nextStage) {
      // Lesson complete
      setCurrentLesson(null);
      return;
    }

    const updated = { ...currentLesson, currentStage: nextStage };
    setCurrentLesson(updated);

    await supabase
      .from('lesson_states')
      .update({ current_stage: nextStage })
      .eq('user_id', user?.id)
      .eq('topic_id', currentLesson.topicId)
      .eq('subtopic', currentLesson.subtopic);
  }, [currentLesson, user]);

  const updatePriorKnowledge = useCallback(async (level: 'never' | 'a-bit' | 'confident') => {
    if (!currentLesson) return;
    const updated = { ...currentLesson, priorKnowledgeLevel: level };
    setCurrentLesson(updated);

    await supabase
      .from('lesson_states')
      .update({ prior_knowledge_level: level })
      .eq('user_id', user?.id)
      .eq('topic_id', currentLesson.topicId)
      .eq('subtopic', currentLesson.subtopic);
  }, [currentLesson, user]);

  const recordMistake = useCallback(async (mistake: string) => {
    if (!currentLesson) return;
    const updated = {
      ...currentLesson,
      mistakesMade: [...currentLesson.mistakesMade, mistake],
    };
    setCurrentLesson(updated);

    await supabase
      .from('lesson_states')
      .update({ mistakes_made: JSON.stringify(updated.mistakesMade) })
      .eq('user_id', user?.id)
      .eq('topic_id', currentLesson.topicId)
      .eq('subtopic', currentLesson.subtopic);
  }, [currentLesson, user]);

  const getStagePrompt = useCallback(() => {
    if (!currentLesson) return '';
    return formatStagePromptForAI(currentLesson.currentStage, {
      topicName: currentLesson.topicId,
      subtopic: currentLesson.subtopic,
      priorKnowledgeLevel: currentLesson.priorKnowledgeLevel,
      recentErrors: currentLesson.mistakesMade,
    });
  }, [currentLesson]);

  const lessonProgress = currentLesson
    ? calculateLessonProgress(currentLesson.currentStage)
    : 0;

  return (
    <LessonStateContext.Provider
      value={{
        currentLesson,
        startLesson,
        advanceStage,
        updatePriorKnowledge,
        recordMistake,
        getStagePrompt,
        lessonProgress,
      }}
    >
      {children}
    </LessonStateContext.Provider>
  );
};

export const useLessonState = () => {
  const context = useContext(LessonStateContext);
  if (!context) throw new Error('useLessonState must be used within LessonStateProvider');
  return context;
};
```

#### 3.3 UI for Lesson Progress

**File**: `src/components/Tutor/LessonProgressBar.tsx`

```tsx
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { DEFAULT_LESSON_FLOW } from '@/types/lessonStateMachine';
import { useLessonState } from '@/contexts/LessonStateContext';

export const LessonProgressBar: React.FC = () => {
  const { currentLesson, lessonProgress } = useLessonState();

  if (!currentLesson) return null;

  const currentStageConfig = DEFAULT_LESSON_FLOW.find(
    (s) => s.stage === currentLesson.currentStage
  );

  return (
    <div className="p-4 bg-muted/30 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {currentStageConfig?.title || 'Lesson in Progress'}
        </span>
        <span className="text-xs text-muted-foreground">{lessonProgress}%</span>
      </div>
      <Progress value={lessonProgress} className="h-2" />
      <p className="text-xs text-muted-foreground mt-1">
        {currentStageConfig?.objective}
      </p>
    </div>
  );
};
```

Add this to `MathsTutorInterface` when in explain mode.

---

### Phase 4: VOICE & BOARD (Future Enhancement)

This requires:
1. **Text-to-Speech**: Use Web Speech API or Elevenlabs for natural voice
2. **Speech-to-Text**: Web Speech API for voice input
3. **Step-by-step board**: Animated LaTeX rendering showing work line-by-line

**Implementation sketch** (for reference):

```typescript
// Voice output
const speakResponse = (text: string) => {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'en-GB';
  speech.rate = 0.9;
  window.speechSynthesis.speak(speech);
};

// Voice input
const startListening = () => {
  const recognition = new (window as any).webkitSpeechRecognition();
  recognition.lang = 'en-GB';
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    sendMessage(transcript);
  };
  recognition.start();
};
```

---

## 📊 Success Metrics

Track these to measure improvement:

1. **Engagement**: Average messages per session (target: increase 30%)
2. **Retention**: Students returning next day (target: >50%)
3. **Hint usage**: % of problems where hints were used (target: 40-60% sweet spot)
4. **Mastery progression**: Avg time from "Learning" to "Comfortable" (track trend)
5. **Subjective feedback**: User surveys on "Does this feel like a real tutor?"

---

## 🎯 Quick Wins Summary

**Do these TODAY for immediate impact:**
1. ✅ Update AI prompts with `enhancedPrompts.ts` (30 min)
2. ✅ Add simple mascot reactions (30 min)
3. ✅ Deploy and test with real usage (10 min)

**This week:**
4. Mastery tracking database + UI (2-3 hours)
5. Display mastery indicators on curriculum (1 hour)

**Next sprint:**
6. Lesson state machine (1 day)
7. Full lesson progress UI (1 day)

---

## 🔧 Testing Checklist

- [ ] Persona: Tutor uses Socratic questions before revealing answers
- [ ] Hints: Progressive scaffolding works (conceptual → structural → procedural)
- [ ] Practice: Questions stay focused on current subtopic
- [ ] Explain: Mini-lesson structure (intro → example → practice)
- [ ] Mascot: Reactions trigger on streaks and completion
- [ ] Mastery: Progress updates after problems
- [ ] Errors: Diagnostic questions instead of "wrong"

---

## 📚 Additional Resources

- **Teacher Moves**: Read "Teach Like a Champion" by Doug Lemov
- **Scaffolding**: "Visible Learning" by John Hattie
- **Gamification**: "Drive" by Daniel Pink (intrinsic motivation)
- **Voice UX**: Khan Academy's tutor design blog

---

## 🙋 Questions? Start Here:

1. **Why lesson states?** → Turns passive Q&A into active learning journey
2. **Why mastery tracking?** → Students see concrete progress, increases motivation
3. **Why progressive hints?** → Develops independence, not dependence on tutor
4. **Why persona?** → Emotional connection makes learning stick

**The goal**: Make it feel less like "asking a smart search engine" and more like "learning with a patient teacher who knows you".

You've got all the pieces. Now execute Phase 1 and iterate based on student feedback! 🚀
