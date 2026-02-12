import React from 'react';
import { Clock, Check, Square, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface ActiveTaskZoneProps {
  activeTask: Task | null;
  onRemoveTask: () => void;
  onCompleteTask: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  sessionGoal?: string;
  timeRemaining?: number;
  totalTime?: number;
  isRunning?: boolean;
}

const ActiveTaskZone: React.FC<ActiveTaskZoneProps> = ({ 
  activeTask, 
  onRemoveTask,
  onCompleteTask,
  onDrop,
  onDragOver,
  sessionGoal,
  timeRemaining = 0,
  totalTime = 0,
  isRunning = false
}) => {
  const elapsedMinutes = Math.floor((totalTime - timeRemaining) / 60);
  const totalMinutes = Math.floor(totalTime / 60);
  const handleDragStart = (e: React.DragEvent) => {
    if (activeTask) {
      e.dataTransfer.setData('activeTaskId', activeTask.id);
      e.dataTransfer.setData('text/plain', activeTask.name);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  return (
    <div 
      className={cn(
        "mt-6 p-4 rounded-lg min-h-[80px] flex items-center justify-center transition-all",
        isRunning && activeTask 
          ? "border-2 border-dashed border-primary/50 bg-primary/10" 
          : "border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/50"
      )}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {activeTask ? (
        <div 
          className="w-full cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={handleDragStart}
        >
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={onCompleteTask}
            >
              {activeTask.completed ? 
                <Check className="h-4 w-4 text-primary" /> : 
                <Square className="h-4 w-4" />
              }
            </Button>
            <Clock className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-foreground">{activeTask.name}</p>
              <p className="text-sm text-muted-foreground">
                {activeTask.timeSpent ? `${activeTask.timeSpent} min tracked` : 'Tracking time...'}
              </p>
            </div>
          </div>
          
          {/* Session Goal */}
          {sessionGoal && (
            <div className="ml-9 p-2 bg-background/50 rounded border border-border/50">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground italic">"{sessionGoal}"</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Drag a task here to start tracking time
        </p>
      )}
    </div>
  );
};

export default ActiveTaskZone;
