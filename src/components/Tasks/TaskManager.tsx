
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TaskInput from './TaskInput';
import TaskList from './TaskList';
import { Task } from '@/types/task';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TaskManager: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editName, setEditName] = useState('');
  const [editPomodoros, setEditPomodoros] = useState(1);
  const { toast } = useToast();

  const handleAddTask = (taskName: string, estimatedPomodoros: number) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: taskName,
      estimatedPomodoros,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    setTasks([newTask, ...tasks]);
    toast({
      title: "Task added",
      description: `"${taskName}" has been added to your tasks`,
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    toast({
      title: "Task deleted",
      description: "The task has been removed",
    });
  };

  const handleToggleComplete = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
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
      setTasks(tasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, name: editName, estimatedPomodoros: editPomodoros } 
          : task
      ));
      setEditingTask(null);
      toast({
        title: "Task updated",
        description: "Your task has been updated",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskInput onAddTask={handleAddTask} />
          <TaskList 
            tasks={tasks} 
            onDeleteTask={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
          />
        </CardContent>
      </Card>

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
