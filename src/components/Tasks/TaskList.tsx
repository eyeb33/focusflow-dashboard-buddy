
import React, { useState } from 'react';
import TaskItem from './TaskItem';
import { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (id: string) => void;
  onDropToList?: (e: React.DragEvent) => void;
  onDragOverList?: (e: React.DragEvent) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onDeleteTask, 
  onToggleComplete,
  onEditTask,
  onDropToList,
  onDragOverList
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOverList) {
      onDragOverList(e);
    }
    setIsDraggingOver(true);
    if (index !== undefined) {
      setDropIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if we're leaving the entire list container
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
      setDropIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setDropIndex(null);
    if (onDropToList) {
      onDropToList(e);
    }
  };

  if (tasks.length === 0) {
    return (
      <div 
        className={`text-center py-6 rounded-lg border-2 border-dashed transition-all duration-200 ${
          isDraggingOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-transparent text-muted-foreground'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
      >
        {isDraggingOver ? 'Drop task here to return it to the list' : 'No tasks yet. Add a task to get started!'}
      </div>
    );
  }

  return (
    <div 
      className="relative"
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      <div className="space-y-1">
        {tasks.map((task, index) => (
          <React.Fragment key={task.id}>
            {dropIndex === index && (
              <div 
                className="h-12 border-2 border-dashed border-primary bg-primary/10 rounded-md animate-scale-in flex items-center justify-center"
              >
                <span className="text-sm text-primary font-medium">Drop here</span>
              </div>
            )}
            <div
              onDragOver={(e) => handleDragOver(e, index)}
              className="transition-all duration-200"
            >
              <TaskItem
                task={task}
                onDelete={onDeleteTask}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
              />
            </div>
          </React.Fragment>
        ))}
        {dropIndex === tasks.length && (
          <div 
            className="h-12 border-2 border-dashed border-primary bg-primary/10 rounded-md animate-scale-in flex items-center justify-center"
            onDragOver={(e) => handleDragOver(e, tasks.length)}
          >
            <span className="text-sm text-primary font-medium">Drop here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
