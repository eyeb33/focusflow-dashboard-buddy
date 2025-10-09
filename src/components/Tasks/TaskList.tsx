
import React, { useState, useRef } from 'react';
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
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOverList?.(e);
    setIsDraggingOver(true);

    // Compute dynamic drop index based on cursor position
    const container = listRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-task-id]'));
    const y = e.clientY;

    let index = items.length;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (y < midpoint) {
        index = i;
        break;
      }
    }
    setDropIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDraggingOver(false);
      setDropIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    setDropIndex(null);
    setDraggingTaskId(null);
    onDropToList?.(e);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setIsDraggingOver(false);
    setDropIndex(null);
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
      ref={listRef}
      className={`space-y-1 p-2 rounded-lg border-2 border-dashed transition-all duration-150 ${
        isDraggingOver 
          ? 'border-primary bg-primary/5' 
          : 'border-transparent'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {tasks
        .filter((task) => task.id !== draggingTaskId)
        .map((task, index) => (
          <React.Fragment key={task.id}>
            {dropIndex === index && (
              <div className="h-2 my-1 rounded bg-[hsl(var(--primary))]/40" />
            )}
            <TaskItem
              task={task}
              onDelete={onDeleteTask}
              onToggleComplete={onToggleComplete}
              onEdit={onEditTask}
              onDragStart={(id) => setDraggingTaskId(id)}
              onDragEnd={handleDragEnd}
            />
          </React.Fragment>
        ))}
      {dropIndex !== null && dropIndex >= tasks.length && (
        <div className="h-2 my-1 rounded bg-[hsl(var(--primary))]/40" />
      )}
    </div>
  );
};

export default TaskList;
