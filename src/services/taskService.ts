
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';

export const fetchTasks = async (userId: string | undefined) => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
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
    createdAt: task.created_at,
    isActive: task.is_active,
    timeSpent: task.time_spent
  })) as Task[];
};

export const addTask = async (userId: string | undefined, taskName: string, estimatedPomodoros: number) => {
  if (!userId) return null;
  
  // Get the max sort_order to place new task at the top
  const { data: maxData } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  
  const nextSortOrder = maxData?.sort_order ? maxData.sort_order + 1 : 1;
  
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        user_id: userId,
        name: taskName,
        estimated_pomodoros: estimatedPomodoros,
        completed: false,
        sort_order: nextSortOrder
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
    createdAt: data.created_at,
    isActive: data.is_active,
    timeSpent: data.time_spent
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

export const setActiveTask = async (userId: string | undefined, taskId: string | null) => {
  if (!userId) return false;
  
  // First, unset all active tasks
  await supabase
    .from('tasks')
    .update({ is_active: false })
    .eq('user_id', userId);
  
  // If taskId is provided, set that task as active
  if (taskId) {
    const { error } = await supabase
      .from('tasks')
      .update({ is_active: true })
      .eq('id', taskId)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error setting active task:', error);
      throw error;
    }
  }
  
  return true;
};

export const updateTaskTimeSpent = async (userId: string | undefined, taskId: string, additionalMinutes: number) => {
  if (!userId) return false;
  
  // Fetch current time spent
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('time_spent')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching task:', fetchError);
    throw fetchError;
  }
  
  const newTimeSpent = (task?.time_spent || 0) + additionalMinutes;
  
  const { error } = await supabase
    .from('tasks')
    .update({ time_spent: newTimeSpent })
    .eq('id', taskId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error updating task time spent:', error);
    throw error;
  }
  
  return true;
};

export const reorderTasks = async (userId: string | undefined, taskIds: string[]) => {
  if (!userId) return false;
  
  try {
    // Update sort_order for each task based on its position in the array
    const updates = taskIds.map((taskId, index) => 
      supabase
        .from('tasks')
        .update({ sort_order: index + 1 })
        .eq('id', taskId)
        .eq('user_id', userId)
    );
    
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return false;
  }
};
