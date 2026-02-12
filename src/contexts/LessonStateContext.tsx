import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { LessonStateRow } from '@/types/database';
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
  incrementCheckCompleted: () => Promise<void>;
  completeLesson: () => Promise<void>;
  getStagePrompt: () => string;
  lessonProgress: number;
  isLoading: boolean;
}

const LessonStateContext = createContext<LessonStateContextType | undefined>(undefined);

export const LessonStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentLesson, setCurrentLesson] = useState<LessonState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load active lesson on mount
  useEffect(() => {
    if (!user) return;
    
    const loadActiveLesson = async () => {
      const { data } = await supabase
        .from('lesson_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const dbLesson = data as LessonStateRow;
        setCurrentLesson({
          currentStage: dbLesson.current_stage as LessonStage,
          topicId: dbLesson.topic_id,
          subtopic: dbLesson.subtopic,
          priorKnowledgeLevel: dbLesson.prior_knowledge_level as 'never' | 'a-bit' | 'confident' | undefined,
          mistakesMade: Array.isArray(dbLesson.mistakes_made) ? dbLesson.mistakes_made as string[] : [],
          checksCompleted: dbLesson.checks_completed || 0,
          checksTotal: dbLesson.checks_total || 3,
          timeSpentSeconds: dbLesson.time_spent_seconds || 0,
        });
      }
    };

    loadActiveLesson();
  }, [user]);

  const startLesson = useCallback(async (topicId: string, subtopic: string) => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Check if there's already an active lesson for this topic/subtopic
      const { data: existing } = await supabase
        .from('lesson_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .eq('subtopic', subtopic)
        .eq('completed', false)
        .maybeSingle();

      if (existing) {
        // Resume existing lesson
        const dbLesson = existing as LessonStateRow;
        setCurrentLesson({
          currentStage: dbLesson.current_stage as LessonStage,
          topicId: dbLesson.topic_id,
          subtopic: dbLesson.subtopic,
          priorKnowledgeLevel: dbLesson.prior_knowledge_level as 'never' | 'a-bit' | 'confident' | undefined,
          mistakesMade: Array.isArray(dbLesson.mistakes_made) ? dbLesson.mistakes_made as string[] : [],
          checksCompleted: dbLesson.checks_completed || 0,
          checksTotal: dbLesson.checks_total || 3,
          timeSpentSeconds: dbLesson.time_spent_seconds || 0,
        });
      } else {
        // Create new lesson
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
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const advanceStage = useCallback(async (condition?: string) => {
    if (!currentLesson || !user) return;
    setIsLoading(true);

    try {
      const nextStage = getNextStage(currentLesson.currentStage, condition);
      
      if (!nextStage) {
        // Lesson complete
        await completeLesson();
        return;
      }

      const updated = { ...currentLesson, currentStage: nextStage };
      setCurrentLesson(updated);

      await supabase
        .from('lesson_states')
        .update({ current_stage: nextStage })
        .eq('user_id', user.id)
        .eq('topic_id', currentLesson.topicId)
        .eq('subtopic', currentLesson.subtopic)
        .eq('completed', false);
    } finally {
      setIsLoading(false);
    }
  }, [currentLesson, user]);

  const updatePriorKnowledge = useCallback(async (level: 'never' | 'a-bit' | 'confident') => {
    if (!currentLesson || !user) return;

    const updated = { ...currentLesson, priorKnowledgeLevel: level };
    setCurrentLesson(updated);

    await supabase
      .from('lesson_states')
      .update({ prior_knowledge_level: level })
      .eq('user_id', user.id)
      .eq('topic_id', currentLesson.topicId)
      .eq('subtopic', currentLesson.subtopic)
      .eq('completed', false);
  }, [currentLesson, user]);

  const recordMistake = useCallback(async (mistake: string) => {
    if (!currentLesson || !user) return;

    const updated = {
      ...currentLesson,
      mistakesMade: [...currentLesson.mistakesMade, mistake],
    };
    setCurrentLesson(updated);

    await supabase
      .from('lesson_states')
      .update({ mistakes_made: updated.mistakesMade })
      .eq('user_id', user.id)
      .eq('topic_id', currentLesson.topicId)
      .eq('subtopic', currentLesson.subtopic)
      .eq('completed', false);
  }, [currentLesson, user]);

  const incrementCheckCompleted = useCallback(async () => {
    if (!currentLesson || !user) return;

    const updated = {
      ...currentLesson,
      checksCompleted: currentLesson.checksCompleted + 1,
    };
    setCurrentLesson(updated);

    await supabase
      .from('lesson_states')
      .update({ checks_completed: updated.checksCompleted })
      .eq('user_id', user.id)
      .eq('topic_id', currentLesson.topicId)
      .eq('subtopic', currentLesson.subtopic)
      .eq('completed', false);
  }, [currentLesson, user]);

  const completeLesson = useCallback(async () => {
    if (!currentLesson || !user) return;
    setIsLoading(true);

    try {
      await supabase
        .from('lesson_states')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('topic_id', currentLesson.topicId)
        .eq('subtopic', currentLesson.subtopic)
        .eq('completed', false);

      setCurrentLesson(null);
    } finally {
      setIsLoading(false);
    }
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
        incrementCheckCompleted,
        completeLesson,
        getStagePrompt,
        lessonProgress,
        isLoading,
      }}
    >
      {children}
    </LessonStateContext.Provider>
  );
};

export const useLessonState = () => {
  const context = useContext(LessonStateContext);
  if (!context) {
    throw new Error('useLessonState must be used within LessonStateProvider');
  }
  return context;
};
