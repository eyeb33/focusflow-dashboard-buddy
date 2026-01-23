
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeInput } from '@/lib/utils';

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
  
  return data.map(task => {
    const t: any = task as any;
    return {
      id: task.id,
      name: task.name,
      estimatedPomodoros: (task as any).estimated_pomodoros,
      completed: task.completed,
      createdAt: (task as any).created_at,
      updatedAt: (task as any).updated_at,
      completedAt: t.completed_at,
      isActive: (task as any).is_active,
      timeSpent: (task as any).time_spent,
      timeSpentSeconds: t.time_spent_seconds,
    } as Task;
  });
};

export const addTask = async (userId: string | undefined, taskName: string, estimatedPomodoros: number) => {
  if (!userId) return null;
  
  // Sanitize user input
  const sanitizedName = sanitizeInput(taskName);
  if (!sanitizedName) return null;
  
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
        name: sanitizedName,
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
    updatedAt: data.updated_at,
    isActive: data.is_active,
    timeSpent: data.time_spent
  } as Task;
};

export const updateTaskCompletion = async (userId: string | undefined, taskId: string, completed: boolean) => {
  if (!userId) return false;
  
  const updateData: any = { 
    completed, 
    updated_at: new Date().toISOString() 
  };
  
  // Set completedAt timestamp when marking as completed, clear it when uncompleting
  if (completed) {
    updateData.completed_at = new Date().toISOString();
  } else {
    updateData.completed_at = null;
  }
  
  const { error } = await supabase
    .from('tasks')
    .update(updateData)
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
  if (updates.name !== undefined) updateData.name = sanitizeInput(updates.name);
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

export const updateTaskTimeSpent = async (userId: string | undefined, taskId: string, additionalMinutes: number, additionalSeconds: number = 0) => {
  if (!userId) return false;
  
  // Fetch current time spent
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('time_spent, time_spent_seconds')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();
    
  if (fetchError) {
    console.error('Error fetching task:', fetchError);
    throw fetchError;
  }
  
  const newTimeSpent = (task?.time_spent || 0) + additionalMinutes;
  const newTimeSpentSeconds = ((task as any)?.time_spent_seconds || 0) + additionalSeconds;
  
  const { error } = await supabase
    .from('tasks')
    .update({ 
      time_spent: newTimeSpent,
      time_spent_seconds: newTimeSpentSeconds,
      updated_at: new Date().toISOString()
    })
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
