import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { SubTask } from '@/types/subtask';
import { cn } from '@/lib/utils';

interface SubTaskListProps {
  subTasks: SubTask[];
  onToggleComplete: (subTaskId: string) => Promise<void>;
  onDeleteSubTask: (subTaskId: string) => Promise<boolean>;
}

export function SubTaskList({ subTasks, onToggleComplete, onDeleteSubTask }: SubTaskListProps) {
  if (subTasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic pl-6">No sub-tasks yet</p>
    );
  }

  return (
    <div className="space-y-1 pl-6">
      {subTasks.map((subTask) => (
        <div
          key={subTask.id}
          className={cn(
            "flex items-center gap-2 group py-1 transition-opacity",
            subTask.completed && "opacity-60"
          )}
        >
          <Checkbox
            checked={subTask.completed}
            onCheckedChange={() => onToggleComplete(subTask.id)}
            className="shrink-0"
          />
          <span
            className={cn(
              "flex-1 text-sm",
              subTask.completed && "line-through text-muted-foreground"
            )}
          >
            {subTask.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteSubTask(subTask.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
