import React from 'react';
import { Progress } from '@/components/ui/progress';
import { LessonStage, DEFAULT_LESSON_FLOW } from '@/types/lessonStateMachine';

interface LessonProgressBarProps {
  currentStage: LessonStage;
  className?: string;
}

const STAGE_NAMES: Record<LessonStage, string> = {
  LESSON_INTRO: 'Introduction',
  PRIOR_KNOWLEDGE_CHECK: 'Assessing Knowledge',
  CONCEPT_OVERVIEW: 'Learning Concept',
  EXAMPLE_TUTOR_DEMO: 'Tutor Example',
  EXAMPLE_GUIDED: 'Guided Practice',
  EXAMPLE_INDEPENDENT: 'Independent Practice',
  QUICK_CHECK: 'Understanding Check',
  REMEDIAL: 'Review & Practice',
  SUMMARY: 'Summary',
  NEXT_STEPS: 'Next Steps'
};

export const LessonProgressBar: React.FC<LessonProgressBarProps> = ({ 
  currentStage, 
  className = '' 
}) => {
  const stageIndex = DEFAULT_LESSON_FLOW.findIndex(stage => stage.stage === currentStage);
  const progress = stageIndex >= 0 
    ? Math.round(((stageIndex + 1) / DEFAULT_LESSON_FLOW.length) * 100)
    : 0;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{STAGE_NAMES[currentStage]}</span>
        <span className="text-muted-foreground text-xs">
          Step {stageIndex + 1} of {DEFAULT_LESSON_FLOW.length}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="text-xs text-muted-foreground">
        Guided lesson step-by-step • {progress}% through this topic
      </div>
    </div>
  );
};

interface DetailedLessonProgressProps {
  currentStage: LessonStage;
  className?: string;
}

export const DetailedLessonProgress: React.FC<DetailedLessonProgressProps> = ({ 
  currentStage,
  className = '' 
}) => {
  const currentIndex = DEFAULT_LESSON_FLOW.findIndex(stage => stage.stage === currentStage);

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="font-semibold text-sm">Lesson Stages</h3>
      <div className="space-y-2">
        {DEFAULT_LESSON_FLOW.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <div 
              key={stage.stage}
              className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                isCurrent ? 'bg-primary/10 border-l-2 border-primary' :
                isCompleted ? 'bg-muted/50' :
                'opacity-50'
              }`}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                isCompleted ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{STAGE_NAMES[stage.stage]}</div>
                {isCurrent && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Current stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
