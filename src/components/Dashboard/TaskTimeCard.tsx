import React from 'react';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { Task } from '@/types/task';

interface TaskTimeCardProps {
  tasks: Task[];
}

const TaskTimeCard: React.FC<TaskTimeCardProps> = ({ tasks }) => {
  // Filter completed tasks with time spent from today
  const today = new Date().toDateString();
  const completedTasksWithTime = tasks.filter(task => {
    if (!task.completed || !task.timeSpent || task.timeSpent === 0) return false;
    // Check if the task was updated today (when it was marked completed)
    const taskDate = new Date(task.createdAt).toDateString();
    return taskDate === today;
  });

  if (completedTasksWithTime.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Task Completion Times
        </h3>
        <p className="text-muted-foreground text-sm">
          No completed tasks yet. Track time by dragging tasks to the timer!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Task Completion Times
      </h3>
      <div className="space-y-3">
        {completedTasksWithTime.map((task) => (
          <div 
            key={task.id} 
            className="flex items-center justify-between p-3 rounded-md bg-muted/50 border"
          >
            <span className="font-medium truncate">{task.name}</span>
            <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
              {task.timeSpent} min
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TaskTimeCard;
