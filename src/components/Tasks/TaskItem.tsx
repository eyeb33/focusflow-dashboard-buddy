
import React from 'react';
import { Trash, Edit, Clock, Check, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onDelete, 
  onToggleComplete,
  onEdit,
  onDragStart,
  onDragEnd,
  isDragging
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('text/plain', task.name);
    e.dataTransfer.effectAllowed = 'move';
    
    // Create a custom drag image that looks like the card
    const dragEl = e.currentTarget as HTMLElement;
    const clone = dragEl.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    clone.style.width = dragEl.offsetWidth + 'px';
    clone.style.opacity = '0.8';
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);
    
    try {
      e.dataTransfer.setDragImage(clone, dragEl.offsetWidth / 2, dragEl.offsetHeight / 2);
    } catch (_) {}
    
    // Clean up clone after drag starts
    setTimeout(() => {
      document.body.removeChild(clone);
    }, 0);
    
    onDragStart?.(task.id);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-md border mb-2 ${task.completed ? 'bg-muted/50' : 'bg-card'} ${!task.completed ? 'cursor-grab active:cursor-grabbing select-none' : ''} ${isDragging ? 'opacity-0 h-0 p-0 m-0 border-0 overflow-hidden' : ''}`}
      data-task-id={task.id}
      draggable={!task.completed}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => onToggleComplete(task.id)}
        >
          {task.completed ? 
            <Check className="h-4 w-4 text-primary" /> : 
            <Square className="h-4 w-4" />
          }
        </Button>
        
        <span className={`${task.completed ? 'line-through text-muted-foreground' : ''}`}>
          {task.name}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center text-sm text-muted-foreground mr-2">
          <Clock className="h-3 w-3 mr-1" />
          <span>{task.estimatedPomodoros}</span>
        </div>
        
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task.id)}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(task.id)}>
          <Trash className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default TaskItem;
