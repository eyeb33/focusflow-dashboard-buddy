import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface CoachActionFeedbackProps {
  action: {
    type: string;
    status: 'executing' | 'success' | 'error';
    message: string;
  } | null;
}

export const CoachActionFeedback = ({ action }: CoachActionFeedbackProps) => {
  if (!action) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border animate-fade-in">
      {action.status === 'executing' && (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
      {action.status === 'success' && (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
      {action.status === 'error' && (
        <XCircle className="h-4 w-4 text-destructive" />
      )}
      <span className="text-sm text-foreground">{action.message}</span>
    </div>
  );
};
