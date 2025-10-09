
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOverList) {
      onDragOverList(e);
    }
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (onDropToList) {
      onDropToList(e);
    }
  };

  if (tasks.length === 0) {
    return (
      <div 
        className={`text-center py-6 rounded-lg border-2 border-dashed transition-all duration-150 ${
          isDraggingOver 
            ? 'border-primary bg-primary/5' 
            : 'border-transparent text-muted-foreground'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDraggingOver ? 'Drop task here' : 'No tasks yet. Add a task to get started!'}
      </div>
    );
  }

  return (
    <div 
      className={`space-y-1 p-2 rounded-lg border-2 border-dashed transition-all duration-150 ${
        isDraggingOver 
          ? 'border-primary bg-primary/5' 
          : 'border-transparent'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onDelete={onDeleteTask}
          onToggleComplete={onToggleComplete}
          onEdit={onEditTask}
        />
      ))}
    </div>
  );
};

export default TaskList;
