import React from 'react';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';

interface ActiveTaskZoneProps {
  activeTask: Task | null;
  onRemoveTask: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const ActiveTaskZone: React.FC<ActiveTaskZoneProps> = ({ 
  activeTask, 
  onRemoveTask,
  onDrop,
  onDragOver
}) => {
  return (
    <div 
      className="mt-6 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 min-h-[80px] flex items-center justify-center transition-colors hover:border-primary/50"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {activeTask ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">{activeTask.name}</p>
              <p className="text-sm text-muted-foreground">
                {activeTask.timeSpent ? `${activeTask.timeSpent} min tracked` : 'Tracking time...'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemoveTask}
            className="h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
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
