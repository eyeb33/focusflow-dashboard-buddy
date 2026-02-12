import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Trash2, ArrowDownUp, ListOrdered } from 'lucide-react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { TimePeriod } from '@/components/Dashboard/TimeToggle';

interface TaskTimeCardProps {
  tasks: Task[];
  selectedPeriod: TimePeriod;
  onTaskDeleted?: (taskId: string) => Promise<boolean>;
}

type SortOption = 'time' | 'order';

const TaskTimeCard: React.FC<TaskTimeCardProps> = ({ tasks, selectedPeriod, onTaskDeleted }) => {
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const { toast } = useToast();

  // Filter completed tasks with time spent based on selected period
  const now = new Date();
  const completedTasksWithTime = tasks.filter(task => {
    if (!task.completed) return false;
    // Check if time has been set (even if 0) - this ensures completed tasks appear
    const hasTimeSet = (task.timeSpent !== null && task.timeSpent !== undefined) || 
                       (task.timeSpentSeconds !== null && task.timeSpentSeconds !== undefined);
    if (!hasTimeSet) return false;
    
    // Use completedAt if available, otherwise fall back to updatedAt
    const taskDate = new Date(task.completedAt || task.updatedAt);
    
    switch (selectedPeriod) {
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return taskDate.toDateString() === yesterday.toDateString();
      }
      case 'today': {
        return taskDate.toDateString() === now.toDateString();
      }
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return taskDate >= weekStart && taskDate <= now;
      }
      case 'month': {
        const monthStart = new Date(now);
        monthStart.setDate(now.getDate() - 30);
        return taskDate >= monthStart && taskDate <= now;
      }
      default:
        return false;
    }
  });

  // Sort tasks based on selected option
  const sortedTasks = [...completedTasksWithTime].sort((a, b) => {
    if (sortBy === 'time') {
      const timeA = (a.timeSpent || 0) * 60 + (a.timeSpentSeconds || 0);
      const timeB = (b.timeSpent || 0) * 60 + (b.timeSpentSeconds || 0);
      return timeB - timeA; // Descending order (longest first)
    } else {
      // Sort by completion time (order completed)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleDelete = async (taskId: string) => {
    if (!onTaskDeleted) return;
    
    try {
      const success = await onTaskDeleted(taskId);
      if (success) {
        toast({
          title: "Task deleted",
          description: "The task has been removed from your list.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Task Completion Times
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowDownUp className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => setSortBy('time')}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              By Time
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('order')}
              className="gap-2"
            >
              <ListOrdered className="h-4 w-4" />
              By Order Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const totalSeconds = (task.timeSpent || 0) * 60 + (task.timeSpentSeconds || 0);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          const timeLabel = minutes > 0 && seconds > 0
            ? `${minutes}m ${seconds}s`
            : minutes > 0
            ? `${minutes}m`
            : `${seconds}s`;

          return (
            <div 
              key={task.id} 
              className="group flex items-center justify-between p-3 rounded-md bg-muted/50 border"
            >
              <span className="font-medium truncate">{task.name}</span>
              <div className="flex items-center gap-2">
                {totalSeconds > 0 && (
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {timeLabel}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={() => handleDelete(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default TaskTimeCard;
