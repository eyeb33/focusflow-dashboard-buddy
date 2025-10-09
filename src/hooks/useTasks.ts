
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { fetchTasks, addTask, updateTaskCompletion, updateTask, deleteTask, setActiveTask, updateTaskTimeSpent, reorderTasks } from '@/services/taskService';
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
        // If completing the currently active task, clear it on the backend
        if (newCompletedState && task.isActive) {
          try {
            await setActiveTask(user?.id, null);
          } catch (e) {
            console.error('Failed to clear active task on completion:', e);
          }
        }

        // Update local state immediately so UI reflects changes and TaskTimeCard picks it up today
        const nowIso = new Date().toISOString();
        setTasks(tasks.map(t => 
          t.id === id 
            ? { 
                ...t, 
                completed: newCompletedState,
                // Ensure it disappears from active zone and list
                isActive: newCompletedState ? false : t.isActive,
                // Make sure "completed today" cards detect it immediately
                updatedAt: nowIso,
              } 
            : t
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

  const handleSetActiveTask = async (taskId: string | null) => {
    try {
      const success = await setActiveTask(user?.id, taskId);
      
      if (success) {
        setTasks(prev => prev.map(task => ({
          ...task,
          isActive: task.id === taskId
        })));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to set active task:', error);
      toast({
        title: "Error setting active task",
        description: "Could not set the active task. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleUpdateTaskTime = async (taskId: string, additionalMinutes: number, additionalSeconds: number = 0) => {
    try {
      const success = await updateTaskTimeSpent(user?.id, taskId, additionalMinutes, additionalSeconds);
      
      if (success) {
        setTasks(tasks.map(task => 
          task.id === taskId 
            ? { 
                ...task, 
                timeSpent: (task.timeSpent || 0) + additionalMinutes,
                timeSpentSeconds: (task.timeSpentSeconds || 0) + additionalSeconds
              } 
            : task
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update task time:', error);
      return false;
    }
  };

  const handleReorderTasks = async (newOrderedTasks: Task[]) => {
    try {
      // Optimistic update
      setTasks(newOrderedTasks);
      
      // Update backend
      const taskIds = newOrderedTasks.map(t => t.id);
      const success = await reorderTasks(user?.id, taskIds);
      
      if (!success) {
        // Revert on failure
        toast({
          title: "Error reordering tasks",
          description: "Could not save the new order. Please try again.",
          variant: "destructive",
        });
      }
      return success;
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      return false;
    }
  };

  return {
    tasks,
    isLoading,
    addTask: handleAddTask,
    toggleComplete: handleToggleComplete,
    editTask: handleEditTask,
    deleteTask: handleDeleteTask,
    setActiveTask: handleSetActiveTask,
    updateTaskTime: handleUpdateTaskTime,
    reorderTasks: handleReorderTasks
  };
};
