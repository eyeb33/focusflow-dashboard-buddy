import { supabase } from "@/integrations/supabase/client";
import { SubTask } from "@/types/subtask";
import { sanitizeInput } from "@/lib/utils";

export const fetchSubTasks = async (userId: string | undefined, parentTaskId: string): Promise<SubTask[]> => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('sub_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('parent_task_id', parentTaskId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching sub-tasks:', error);
    throw error;
  }
  
  return data || [];
};

export const addSubTask = async (userId: string | undefined, parentTaskId: string, name: string): Promise<SubTask | null> => {
  if (!userId) return null;
  
  // Sanitize user input
  const sanitizedName = sanitizeInput(name);
  if (!sanitizedName) return null;
  
  // Get current max sort_order
  const { data: existingSubTasks } = await supabase
    .from('sub_tasks')
    .select('sort_order')
    .eq('parent_task_id', parentTaskId)
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1);
    
  const maxSortOrder = existingSubTasks?.[0]?.sort_order ?? -1;
  
  const { data, error } = await supabase
    .from('sub_tasks')
    .insert({
      parent_task_id: parentTaskId,
      user_id: userId,
      name: sanitizedName,
      sort_order: maxSortOrder + 1,
      completed: false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding sub-task:', error);
    throw error;
  }
  
  return data;
};

export const updateSubTaskCompletion = async (userId: string | undefined, subTaskId: string, completed: boolean): Promise<boolean> => {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('sub_tasks')
    .update({ completed, updated_at: new Date().toISOString() })
    .eq('id', subTaskId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error updating sub-task completion:', error);
    throw error;
  }
  
  return true;
};

export const deleteSubTask = async (userId: string | undefined, subTaskId: string): Promise<boolean> => {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('sub_tasks')
    .delete()
    .eq('id', subTaskId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error deleting sub-task:', error);
    throw error;
  }
  
  return true;
};

export const reorderSubTasks = async (
  userId: string | undefined,
  parentTaskId: string,
  subTasks: SubTask[]
): Promise<boolean> => {
  if (!userId) return false;

  // Update sort_order for all sub-tasks in batch
  const updates = subTasks.map((subTask, index) => 
    supabase
      .from('sub_tasks')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', subTask.id)
      .eq('user_id', userId)
  );

  try {
    await Promise.all(updates);
    return true;
  } catch (error) {
    console.error('Error reordering sub-tasks:', error);
    throw error;
  }
};

export const promoteSubTaskToTask = async (
  userId: string | undefined,
  subTaskId: string
): Promise<boolean> => {
  if (!userId) return false;

  // Get the sub-task details
  const { data: subTask, error: fetchError } = await supabase
    .from('sub_tasks')
    .select('name')
    .eq('id', subTaskId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !subTask) {
    console.error('Error fetching sub-task:', fetchError);
    throw fetchError;
  }

  // Create a new main task
  const { error: insertError } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      name: subTask.name,
      completed: false,
      estimated_pomodoros: 1
    });

  if (insertError) {
    console.error('Error creating main task:', insertError);
    throw insertError;
  }

  // Delete the sub-task
  const { error: deleteError } = await supabase
    .from('sub_tasks')
    .delete()
    .eq('id', subTaskId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting sub-task:', deleteError);
    throw deleteError;
  }

  return true;
};

export const moveSubTaskToParent = async (
  userId: string | undefined,
  subTaskId: string,
  newParentId: string
): Promise<boolean> => {
  if (!userId) return false;

  // Get current max sort_order for new parent
  const { data: existingSubTasks } = await supabase
    .from('sub_tasks')
    .select('sort_order')
    .eq('parent_task_id', newParentId)
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const maxSortOrder = existingSubTasks?.[0]?.sort_order ?? -1;

  // Update the sub-task's parent and sort_order
  const { error } = await supabase
    .from('sub_tasks')
    .update({
      parent_task_id: newParentId,
      sort_order: maxSortOrder + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', subTaskId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error moving sub-task:', error);
    throw error;
  }

  return true;
};
