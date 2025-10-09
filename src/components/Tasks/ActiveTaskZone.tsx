import React from 'react';
import { Clock, Check, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Task } from '@/types/task';

interface ActiveTaskZoneProps {
  activeTask: Task | null;
  onRemoveTask: () => void;
  onCompleteTask: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
}

const ActiveTaskZone: React.FC<ActiveTaskZoneProps> = ({ 
  activeTask, 
  onRemoveTask,
  onCompleteTask,
  onDrop,
  onDragOver
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (activeTask) {
      e.dataTransfer.setData('activeTaskId', activeTask.id);
      e.dataTransfer.setData('text/plain', activeTask.name);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  return (
    <div 
      className="mt-6 p-4 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 min-h-[80px] flex items-center justify-center transition-colors hover:border-primary/50"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {activeTask ? (
        <div 
          className="flex items-center justify-between w-full cursor-grab active:cursor-grabbing"
          draggable
          onDragStart={handleDragStart}
        >
          <div className="flex items-center gap-3">
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
            <div>
              <p className="font-medium text-foreground">{activeTask.name}</p>
              <p className="text-sm text-muted-foreground">
                {activeTask.timeSpent ? `${activeTask.timeSpent} min tracked` : 'Tracking time...'}
              </p>
            </div>
          </div>
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
