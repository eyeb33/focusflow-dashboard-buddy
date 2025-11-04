
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import { Task } from '@/types/task';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const TaskManager: React.FC = () => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState('');
  const [editPomodoros, setEditPomodoros] = useState(1);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { tasks, isLoading, addTask, toggleComplete, editTask, deleteTask } = useTasks();

  const handleAddTask = (taskName: string, estimatedPomodoros: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add tasks.",
        variant: "destructive",
      });
      return;
    }
    
    addTask(taskName, estimatedPomodoros).then(success => {
      if (success) {
        toast({
          title: "Task added",
          description: `"${taskName}" has been added to your tasks`,
        });
      }
    });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id).then(success => {
      if (success) {
        toast({
          title: "Task deleted",
          description: "The task has been removed",
        });
      }
    });
  };

  const handleToggleComplete = (id: string) => {
    setCompletingTaskId(id);
    setTimeout(() => {
      toggleComplete(id);
      setTimeout(() => setCompletingTaskId(null), 300);
    }, 400);
  };

  const handleEditTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setEditingTask(task);
      setEditName(task.name);
      setEditPomodoros(task.estimatedPomodoros);
    }
  };

  const handleSaveEdit = () => {
    if (editingTask && editName.trim()) {
      editTask(editingTask.id, editName, editPomodoros).then(success => {
        if (success) {
          setEditingTask(null);
          toast({
            title: "Task updated",
            description: "Your task has been updated",
          });
        }
      });
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col">
        <div className="pb-3">
          <h2 className="text-2xl font-display font-semibold tracking-tight">Tasks</h2>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <TaskInput onAddTask={handleAddTask} />
          
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto mt-4">
              <TaskList 
                tasks={tasks.filter(t => !t.completed)} 
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                completingTaskId={completingTaskId}
              />
            </div>
          )}
          
          {!user && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Sign in to save and sync your tasks across devices</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="task-name" className="text-sm font-medium">
                Task name
              </label>
              <Input
                id="task-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="pomodoro-count" className="text-sm font-medium">
                Estimated pomodoros
              </label>
              <Input
                id="pomodoro-count"
                type="number"
                min="1"
                max="10"
                value={editPomodoros}
                onChange={(e) => setEditPomodoros(parseInt(e.target.value) || 1)}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskManager;
