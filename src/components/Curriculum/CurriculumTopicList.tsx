import React from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import CurriculumTopicCard from './CurriculumTopicCard';
import { CurriculumCategory, TopicWithSession } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface CurriculumTopicListProps {
  categories: CurriculumCategory[];
  topicsWithSessions: TopicWithSession[];
  categoryProgress: Record<string, { completed: number; total: number }>;
  isLoading: boolean;
  activeTopicId: string | null;
  onTopicClick: (topicId: string, topicName: string) => void;
  onSubtopicToggle: (topicId: string, subtopic: string) => void;
  onCategoryToggle: (category: string) => void;
}

const CurriculumTopicList: React.FC<CurriculumTopicListProps> = ({
  categories,
  topicsWithSessions,
  categoryProgress,
  isLoading,
  activeTopicId,
  onTopicClick,
  onSubtopicToggle,
  onCategoryToggle
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-8 text-muted-foreground">
        <BookOpen className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No curriculum loaded</p>
        <p className="text-sm mt-1">Curriculum topics will appear here</p>
      </div>
    );
  }

  // Calculate overall progress
  const totalTopics = Object.values(categoryProgress).reduce((sum, p) => sum + p.total, 0);
  const completedTopics = Object.values(categoryProgress).reduce((sum, p) => sum + p.completed, 0);
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto space-y-4 px-1 py-2 task-list-scroll">
      {/* Overall progress header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {completedTopics}/{totalTopics} topics
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {overallProgress}% of the A-Level Maths curriculum completed
        </p>
      </div>

      {/* Categories */}
      {categories.map(category => {
        const progress = categoryProgress[category.name];
        const categoryPercent = progress 
          ? Math.round((progress.completed / progress.total) * 100) 
          : 0;

        return (
          <div key={category.name} className="space-y-2">
            {/* Category header */}
            <button
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                'bg-muted/50 hover:bg-muted'
              )}
              onClick={() => onCategoryToggle(category.name)}
            >
              <div className="flex items-center gap-2">
                {category.isExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <span className="font-semibold">{category.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({progress?.completed || 0}/{progress?.total || 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={categoryPercent} className="h-2 w-20" />
                <span className="text-xs text-muted-foreground w-8">
                  {categoryPercent}%
                </span>
              </div>
            </button>

            {/* Topics in category */}
            {category.isExpanded && (
              <div className="pl-2 space-y-1 animate-accordion-down">
                {category.topics.map(topic => {
                  const topicData = topicsWithSessions.find(
                    t => t.topic.topicId === topic.topicId
                  );
                  if (!topicData) return null;

                  return (
                    <CurriculumTopicCard
                      key={topic.topicId}
                      topicData={topicData}
                      onTopicClick={onTopicClick}
                      onSubtopicToggle={onSubtopicToggle}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CurriculumTopicList;
