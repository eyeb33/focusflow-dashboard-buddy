
import React from 'react';
import { Trash, Edit, Clock, Check, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from '@/types/task';

interface TaskItemProps {
  task: Task;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onDelete, 
  onToggleComplete,
  onEdit
}) => {
  return (
    <div className={`flex items-center justify-between p-3 rounded-md border mb-2 ${task.completed ? 'bg-muted/50' : 'bg-card'}`}>
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
