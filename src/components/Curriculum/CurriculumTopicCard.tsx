import React, { useMemo } from 'react';
import { 
  Check, 
  Square, 
  ChevronDown, 
  ChevronRight, 
  GraduationCap, 
  Clock,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { TopicWithSession } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface CurriculumTopicCardProps {
  topicData: TopicWithSession;
  onTopicClick: (topicId: string, topicName: string) => void;
  onSubtopicToggle: (topicId: string, subtopic: string) => void;
}

const CurriculumTopicCard: React.FC<CurriculumTopicCardProps> = ({
  topicData,
  onTopicClick,
  onSubtopicToggle
}) => {
  const { topic, session, progressPercent, isActive } = topicData;
  const [isExpanded, setIsExpanded] = React.useState(isActive);

  // Auto-expand when topic becomes active
  React.useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  const isCompleted = progressPercent === 100 && topic.subtopics.length > 0;

  // Format time spent
  const formatTimeSpent = useMemo(() => {
    if (!session || session.totalTimeSeconds === 0) return null;
    
    const totalSeconds = session.totalTimeSeconds;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [session]);

  // Format last accessed
  const lastAccessedText = useMemo(() => {
    if (!session?.lastAccessed) return null;
    
    const lastDate = new Date(session.lastAccessed);
    const now = new Date();
    const diffMs = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }, [session]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="checkbox"]')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleStudyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTopicClick(topic.topicId, topic.name);
  };

  return (
    <div 
      className={cn(
        'group rounded-lg border mb-2 transition-all duration-200',
        isActive 
          ? 'bg-primary/10 border-primary ring-2 ring-primary/30' 
          : isCompleted
            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
            : 'bg-card hover:bg-accent/50'
      )}
    >
      {/* Main row */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Completion indicator */}
          <div className={cn(
            'h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0',
            isCompleted 
              ? 'bg-green-500 text-white' 
              : 'border-2 border-muted-foreground/30'
          )}>
            {isCompleted && <Check className="h-3 w-3" />}
          </div>

          {/* Expand/collapse arrow */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {/* Topic info */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <span 
                className={cn(
                  'font-medium text-sm truncate flex-1 min-w-0',
                  isCompleted && 'text-green-700 dark:text-green-400'
                )}
                title={topic.name}
              >
                {topic.name}
              </span>
              {isActive && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium flex-shrink-0 whitespace-nowrap">
                  Active
                </span>
              )}
            </div>

            {/* Progress bar - always visible when collapsed */}
            {!isExpanded && topic.subtopics.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <Progress 
                  value={progressPercent} 
                  className={cn(
                    'h-1.5 w-28',
                    isCompleted && '[&>div]:bg-green-500'
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {progressPercent}%
                </span>
              </div>
            )}

            {/* Stats row */}
            {session && (formatTimeSpent || session.messageCount > 0) && (
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {formatTimeSpent && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeSpent}
                  </span>
                )}
                {session.messageCount > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {session.messageCount}
                  </span>
                )}
                {lastAccessedText && (
                  <span>Last: {lastAccessedText}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Study button - icon only on small screens */}
        <Button
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'flex-shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2 lg:px-3',
            isActive && 'opacity-100'
          )}
          onClick={handleStudyClick}
        >
          <GraduationCap className="h-4 w-4 flex-shrink-0" />
          <span className="hidden lg:inline">{isActive ? 'Studying' : 'Study'}</span>
        </Button>
      </div>

      {/* Expanded subtopics */}
      {isExpanded && topic.subtopics.length > 0 && (
        <div className="px-4 pb-4 animate-accordion-down">
          <div className="pt-2 border-t space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              Subtopics ({session?.completedSubtopics.length || 0}/{topic.subtopics.length})
            </h4>
            {topic.subtopics.map((subtopic, idx) => {
              const isSubtopicCompleted = session?.completedSubtopics.includes(subtopic);
              return (
                <div 
                  key={idx}
                  className="flex items-center gap-2 py-1"
                >
                  <Checkbox
                    checked={isSubtopicCompleted}
                    onCheckedChange={() => onSubtopicToggle(topic.topicId, subtopic)}
                  />
                  <span className={cn(
                    'text-sm',
                    isSubtopicCompleted && 'line-through text-muted-foreground'
                  )}>
                    {subtopic}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumTopicCard;
