
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';

export const fetchTasks = async (userId: string | undefined) => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
  
  return data.map(task => ({
    id: task.id,
    name: task.name,
    estimatedPomodoros: task.estimated_pomodoros,
    completed: task.completed,
    createdAt: task.created_at
  })) as Task[];
};

export const addTask = async (userId: string | undefined, taskName: string, estimatedPomodoros: number) => {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: userId,
        name: taskName,
        estimated_pomodoros: estimatedPomodoros,
        completed: false
      }
    ])
    .select()
    .single();
    
  if (error) {
    console.error('Error adding task:', error);
    throw error;
  }
  
  return {
    id: data.id,
    name: data.name,
    estimatedPomodoros: data.estimated_pomodoros,
    completed: data.completed,
    createdAt: data.created_at
  } as Task;
};

export const updateTaskCompletion = async (userId: string | undefined, taskId: string, completed: boolean) => {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', taskId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error updating task completion:', error);
    throw error;
  }
  
  return true;
};

export const updateTask = async (userId: string | undefined, taskId: string, updates: { name?: string, estimatedPomodoros?: number }) => {
  if (!userId) return false;
  
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.estimatedPomodoros !== undefined) updateData.estimated_pomodoros = updates.estimatedPomodoros;
  
  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }
  
  return true;
};

export const deleteTask = async (userId: string | undefined, taskId: string) => {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
  
  return true;
};
