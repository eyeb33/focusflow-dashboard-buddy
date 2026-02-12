import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X, GripVertical, ArrowUpRight, MoveRight } from 'lucide-react';
import { SubTask } from '@/types/subtask';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SubTaskListProps {
  subTasks: SubTask[];
  onToggleComplete: (subTaskId: string) => Promise<void>;
  onDeleteSubTask: (subTaskId: string) => Promise<boolean>;
  onReorderSubTasks: (subTaskId: string, newIndex: number) => Promise<void>;
  onPromoteToTask: (subTaskId: string) => Promise<void>;
  availableTasks?: Array<{ id: string; name: string }>;
  onMoveToTask?: (subTaskId: string, newParentId: string) => Promise<void>;
}

export function SubTaskList({ 
  subTasks, 
  onToggleComplete, 
  onDeleteSubTask,
  onReorderSubTasks,
  onPromoteToTask,
  availableTasks = [],
  onMoveToTask
}: SubTaskListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (subTasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic pl-6">No sub-tasks yet</p>
    );
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const draggedSubTask = subTasks[draggedIndex];
    await onReorderSubTasks(draggedSubTask.id, dropIndex);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-1 pl-6">
      {subTasks.map((subTask, index) => (
        <div
          key={subTask.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center gap-2 group py-1 transition-all cursor-grab active:cursor-grabbing",
            subTask.completed && "opacity-60",
            draggedIndex === index && "opacity-40 scale-95"
          )}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              >
                <MoveRight className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPromoteToTask(subTask.id)}>
                <ArrowUpRight className="w-3 h-3 mr-2" />
                Convert to Main Task
              </DropdownMenuItem>
              {availableTasks.length > 0 && onMoveToTask && (
                <>
                  <DropdownMenuItem disabled className="text-xs font-semibold">
                    Move to Task:
                  </DropdownMenuItem>
                  {availableTasks.map((task) => (
                    <DropdownMenuItem
                      key={task.id}
                      onClick={() => onMoveToTask(subTask.id, task.id)}
                      className="pl-6"
                    >
                      {task.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
