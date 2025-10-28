import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, TrendingUp, XCircle } from 'lucide-react';

interface SessionReflectionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (quality: 'completed' | 'progress' | 'distracted', reflection: string) => void;
  sessionGoal?: string;
  taskName?: string;
  durationMinutes: number;
}

export const SessionReflectionModal: React.FC<SessionReflectionModalProps> = ({
  open,
  onClose,
  onSubmit,
  sessionGoal,
  taskName,
  durationMinutes
}) => {
  const [selectedQuality, setSelectedQuality] = useState<'completed' | 'progress' | 'distracted' | null>(null);
  const [reflection, setReflection] = useState('');

  const handleSubmit = () => {
    if (selectedQuality) {
      onSubmit(selectedQuality, reflection);
      setSelectedQuality(null);
      setReflection('');
      onClose();
    }
  };

  const qualityOptions = [
    {
      value: 'completed' as const,
      label: 'Completed my goal',
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10 hover:bg-green-500/20 border-green-500',
      description: 'I accomplished what I set out to do'
    },
    {
      value: 'progress' as const,
      label: 'Made progress',
      icon: TrendingUp,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500',
      description: 'I moved forward but didn\'t finish'
    },
    {
      value: 'distracted' as const,
      label: 'Got distracted',
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500',
      description: 'I had trouble focusing'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How did this session go?</DialogTitle>
          <DialogDescription>
            Take a moment to reflect on your focus session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{durationMinutes} minutes</span>
            </div>
            {taskName && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Task</span>
                <span className="font-medium truncate ml-4">{taskName}</span>
              </div>
            )}
            {sessionGoal && (
              <div className="text-sm">
                <span className="text-muted-foreground">Your goal: </span>
                <span className="font-medium italic">"{sessionGoal}"</span>
              </div>
            )}
          </div>

          {/* Quality Selection */}
          <div className="space-y-2">
            <Label>How would you rate this session?</Label>
            <div className="space-y-2">
              {qualityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedQuality === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedQuality(option.value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? option.bgColor + ' border-2'
                        : 'border-border hover:border-primary/50 bg-background'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${option.color}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Reflection */}
          <div className="space-y-2">
            <Label htmlFor="reflection">What helped or hindered you? (optional)</Label>
            <Textarea
              id="reflection"
              placeholder="e.g., 'Good music helped me focus' or 'Too many notifications'"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              maxLength={300}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reflection.length}/300 characters
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedQuality}
            className="bg-primary"
          >
            Complete Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};