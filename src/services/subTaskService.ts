import { supabase } from "@/integrations/supabase/client";
import { SubTask } from "@/types/subtask";

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
      name,
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
