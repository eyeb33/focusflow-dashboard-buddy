import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubTask } from '@/types/subtask';
import * as subTaskService from '@/services/subTaskService';
import { toast } from 'sonner';

export function useSubTasks(parentTaskId: string | null) {
  const { user } = useAuth();
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load sub-tasks for the parent task
  useEffect(() => {
    if (!user || !parentTaskId) {
      setSubTasks([]);
      return;
    }

    const loadSubTasks = async () => {
      setIsLoading(true);
      try {
        const data = await subTaskService.fetchSubTasks(user.id, parentTaskId);
        setSubTasks(data);
      } catch (error) {
        console.error('Error loading sub-tasks:', error);
        toast.error('Failed to load sub-tasks');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubTasks();
  }, [user, parentTaskId]);

  // Real-time subscription for sub-task updates
  useEffect(() => {
    if (!user || !parentTaskId) return;

    const channel = supabase
      .channel('sub-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sub_tasks',
          filter: `parent_task_id=eq.${parentTaskId}`
        },
        (payload) => {
          console.log('Sub-task change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newSubTask = payload.new as SubTask;
            setSubTasks(prev => {
              if (prev.some(st => st.id === newSubTask.id)) return prev;
              return [...prev, newSubTask].sort((a, b) => 
                (a.sort_order ?? 0) - (b.sort_order ?? 0)
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedSubTask = payload.new as SubTask;
            setSubTasks(prev => prev.map(st => st.id === updatedSubTask.id ? updatedSubTask : st));
          } else if (payload.eventType === 'DELETE') {
            const deletedSubTask = payload.old as SubTask;
            setSubTasks(prev => prev.filter(st => st.id !== deletedSubTask.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, parentTaskId]);

  const handleAddSubTask = async (name: string): Promise<string | null> => {
    if (!parentTaskId) return null;
    
    try {
      const newSubTask = await subTaskService.addSubTask(user?.id, parentTaskId, name);
      if (newSubTask) {
        toast.success('Sub-task added');
        return newSubTask.id;
      }
      return null;
    } catch (error) {
      console.error('Error adding sub-task:', error);
      toast.error('Failed to add sub-task');
      return null;
    }
  };

  const handleToggleComplete = async (subTaskId: string): Promise<void> => {
    const subTask = subTasks.find(st => st.id === subTaskId);
    if (!subTask) return;

    try {
      await subTaskService.updateSubTaskCompletion(user?.id, subTaskId, !subTask.completed);
    } catch (error) {
      console.error('Error toggling sub-task:', error);
      toast.error('Failed to update sub-task');
    }
  };

  const handleDeleteSubTask = async (subTaskId: string): Promise<boolean> => {
    try {
      await subTaskService.deleteSubTask(user?.id, subTaskId);
      toast.success('Sub-task deleted');
      return true;
    } catch (error) {
      console.error('Error deleting sub-task:', error);
      toast.error('Failed to delete sub-task');
      return false;
    }
  };

  return {
    subTasks,
    isLoading,
    handleAddSubTask,
    handleToggleComplete,
    handleDeleteSubTask
  };
}
