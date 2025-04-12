
import React from 'react';
import TaskItem from './TaskItem';
import { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (id: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onDeleteTask, 
  onToggleComplete,
  onEditTask 
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No tasks yet. Add a task to get started!
      </div>
    );
  }

  return (
    <div className="space-y-1">
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
