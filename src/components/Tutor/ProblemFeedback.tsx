import React from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProblemFeedbackProps {
  onCorrect: () => void;
  onIncorrect: () => void;
  onHintUsed: () => void;
  className?: string;
  disabled?: boolean;
}

export const ProblemFeedback: React.FC<ProblemFeedbackProps> = ({
  onCorrect,
  onIncorrect,
  onHintUsed,
  className,
  disabled = false
}) => {
  return (
    <div className={cn("flex items-center gap-2 p-3 bg-muted/50 rounded-lg border", className)}>
      <div className="flex-1">
        <p className="text-sm font-medium mb-1">How did you do?</p>
        <p className="text-xs text-muted-foreground">Help us track your progress!</p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onCorrect}
          variant="outline"
          size="sm"
          className="bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
          disabled={disabled}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Got it!
        </Button>
        <Button
          onClick={onHintUsed}
          variant="outline"
          size="sm"
          className="bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/30 dark:hover:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
          disabled={disabled}
        >
          <Lightbulb className="h-4 w-4 mr-1" />
          Needed hint
        </Button>
        <Button
          onClick={onIncorrect}
          variant="outline"
          size="sm"
          className="bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
          disabled={disabled}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Struggling
        </Button>
      </div>
    </div>
  );
};
