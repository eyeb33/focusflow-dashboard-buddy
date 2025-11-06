import React, { useState, useMemo } from 'react';
import { Trash, Edit, Check, Square, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Task } from '@/types/task';
import { useSubTasks } from '@/hooks/useSubTasks';
import { SubTaskList } from './SubTaskList';
import { SubTaskInput } from './SubTaskInput';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isCompleting?: boolean;
  allTasks?: Task[];
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onDelete, 
  onToggleComplete,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging,
  isCompleting,
  allTasks = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    subTasks, 
    isLoading, 
    handleAddSubTask, 
    handleToggleComplete, 
    handleDeleteSubTask,
    handleReorderSubTasks,
    handlePromoteToTask,
    handleMoveToTask
  } = useSubTasks(task.id); // Always load sub-tasks, not just when expanded

  // Calculate progress
  const subTaskProgress = useMemo(() => {
    if (subTasks.length === 0) return null;
    const completed = subTasks.filter(st => st.completed).length;
    const total = subTasks.length;
    const percentage = (completed / total) * 100;
    return { completed, total, percentage };
  }, [subTasks]);

  // Get available tasks for moving sub-tasks (excluding current task and completed tasks)
  const availableTasks = useMemo(() => {
    return allTasks
      .filter(t => t.id !== task.id && !t.completed)
      .map(t => ({ id: t.id, name: t.name }));
  }, [allTasks, task.id]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('text/plain', task.name);
    e.dataTransfer.effectAllowed = 'move';
    
    onDragStart?.(task.id);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[role="button"]') ||
      target.closest('input')
    ) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(task.id);
  };

  return (
    <div 
      className={`group rounded-md border mb-2 transition-all ${task.completed ? 'bg-muted/50' : 'bg-card'} ${isDragging ? 'opacity-40 scale-95' : ''} ${isCompleting ? 'animate-fade-out' : ''}`}
      data-task-id={task.id}
    >
      <div
        className={`flex items-center justify-between p-3 ${!task.completed ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
        draggable={!task.completed}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-6 w-6 transition-all ${isCompleting ? 'scale-110' : ''}`}
            onClick={handleCheckboxClick}
          >
            {task.completed || isCompleting ? 
              <Check className={`h-4 w-4 text-primary ${isCompleting ? 'animate-scale-in' : ''}`} /> : 
              <Square className="h-4 w-4" />
            }
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
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
          
          <div className="flex-1">
            <span className={`${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.name}
            </span>
            {!isExpanded && subTaskProgress && (
              <div className="flex items-center gap-2 mt-1">
                <Progress value={subTaskProgress.percentage} className="h-1.5 w-24" />
                <span className="text-xs text-muted-foreground">
                  {subTaskProgress.completed}/{subTaskProgress.total}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center text-sm text-muted-foreground mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task.id);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-accordion-down">
          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold mb-2">Sub-tasks</h4>
            <SubTaskList
              subTasks={subTasks}
              onToggleComplete={handleToggleComplete}
              onDeleteSubTask={handleDeleteSubTask}
              onReorderSubTasks={handleReorderSubTasks}
              onPromoteToTask={handlePromoteToTask}
              availableTasks={availableTasks}
              onMoveToTask={handleMoveToTask}
            />
            <SubTaskInput onAddSubTask={handleAddSubTask} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
