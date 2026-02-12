import React from 'react';
import { 
  BookOpen, 
  BookMarked, 
  GraduationCap, 
  Trophy, 
  Circle 
} from 'lucide-react';
import { TopicSession } from '@/types/curriculum';

interface MasteryIconProps {
  masteryLevel: TopicSession['masteryLevel'];
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const MASTERY_CONFIG = {
  'not-started': {
    icon: Circle,
    color: 'text-gray-400',
    label: 'Not Started',
    description: 'Begin learning this topic'
  },
  'learning': {
    icon: BookOpen,
    color: 'text-blue-500',
    label: 'Learning',
    description: 'Getting familiar with concepts'
  },
  'practiced': {
    icon: BookMarked,
    color: 'text-purple-500',
    label: 'Practiced',
    description: 'Building confidence'
  },
  'proficient': {
    icon: GraduationCap,
    color: 'text-green-500',
    label: 'Proficient',
    description: 'Strong understanding'
  },
  'exam-ready': {
    icon: Trophy,
    color: 'text-yellow-500',
    label: 'Exam Ready',
    description: 'Mastered and exam-ready!'
  }
};

export const MasteryIcon: React.FC<MasteryIconProps> = ({ 
  masteryLevel, 
  size = 16,
  showLabel = false,
  className = ''
}) => {
  const config = MASTERY_CONFIG[masteryLevel];
  const Icon = config.icon;

  if (showLabel) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Icon className={`${config.color}`} size={size} />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{config.label}</span>
          <span className="text-xs text-muted-foreground">{config.description}</span>
        </div>
      </div>
    );
  }

  return (
    <div title={`${config.label}: ${config.description}`}>
      <Icon 
        className={`${config.color} ${className}`} 
        size={size}
      />
    </div>
  );
};

interface MasteryBadgeProps {
  session: TopicSession;
  className?: string;
}

export const MasteryBadge: React.FC<MasteryBadgeProps> = ({ session, className = '' }) => {
  const config = MASTERY_CONFIG[session.masteryLevel];
  const Icon = config.icon;
  
  const accuracy = session.attemptedProblems > 0
    ? Math.round((session.correctProblems / session.attemptedProblems) * 100)
    : 0;

  return (
    <div className={`flex items-center gap-3 p-3 bg-card rounded-lg border ${className}`}>
      <Icon className={config.color} size={24} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium">{config.label}</span>
          {session.attemptedProblems > 0 && (
            <span className="text-sm text-muted-foreground">
              {accuracy}% accuracy
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {session.attemptedProblems} problems attempted
          {session.examStyleAttempts > 0 && ` · ${session.examStyleAttempts} exam-style`}
        </div>
      </div>
    </div>
  );
};
