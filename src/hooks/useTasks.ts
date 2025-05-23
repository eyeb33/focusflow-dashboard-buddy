
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { fetchTasks, addTask, updateTaskCompletion, updateTask, deleteTask } from '@/services/taskService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadTasks = async () => {
      if (!user) {
        setTasks([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await fetchTasks(user.id);
        setTasks(data);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        toast({
          title: "Error loading tasks",
          description: "Could not load your tasks. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTasks();
  }, [user]);

  const handleAddTask = async (taskName: string, estimatedPomodoros: number) => {
    try {
      const newTask = await addTask(user?.id, taskName, estimatedPomodoros);
      if (newTask) {
        setTasks([newTask, ...tasks]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add task:', error);
      toast({
        title: "Error adding task",
        description: "Could not add your task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const newCompletedState = !task.completed;
      const success = await updateTaskCompletion(user?.id, id, newCompletedState);
      
      if (success) {
        setTasks(tasks.map(task => 
          task.id === id ? { ...task, completed: newCompletedState } : task
        ));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Error updating task",
        description: "Could not update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = async (id: string, name: string, estimatedPomodoros: number) => {
    try {
      const success = await updateTask(user?.id, id, { name, estimatedPomodoros });
      
      if (success) {
        setTasks(tasks.map(task => 
          task.id === id 
            ? { ...task, name, estimatedPomodoros } 
            : task
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to edit task:', error);
      toast({
        title: "Error updating task",
        description: "Could not update the task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const success = await deleteTask(user?.id, id);
      
      if (success) {
        setTasks(tasks.filter(task => task.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Error deleting task",
        description: "Could not delete the task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    addTask: handleAddTask,
    toggleComplete: handleToggleComplete,
    editTask: handleEditTask,
    deleteTask: handleDeleteTask
  };
};
