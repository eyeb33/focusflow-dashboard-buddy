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
        console.log('Loaded sub-tasks:', data);
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

    console.log('Setting up realtime subscription for parent task:', parentTaskId);
    
    const channel = supabase
      .channel(`sub-tasks-${parentTaskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sub_tasks',
          filter: `parent_task_id=eq.${parentTaskId}`
        },
        (payload) => {
          console.log('Sub-task change detected:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            const newSubTask = payload.new as SubTask;
            console.log('Adding new sub-task:', newSubTask);
            setSubTasks(prev => {
              const exists = prev.some(st => st.id === newSubTask.id);
              console.log('Sub-task exists?', exists, 'Current count:', prev.length);
              if (exists) return prev;
              const updated = [...prev, newSubTask].sort((a, b) => 
                (a.sort_order ?? 0) - (b.sort_order ?? 0)
              );
              console.log('Updated sub-tasks count:', updated.length);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedSubTask = payload.new as SubTask;
            console.log('Updating sub-task:', updatedSubTask);
            setSubTasks(prev => prev.map(st => 
              st.id === updatedSubTask.id ? updatedSubTask : st
            ).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
          } else if (payload.eventType === 'DELETE') {
            const deletedSubTask = payload.old as SubTask;
            console.log('Deleting sub-task:', deletedSubTask);
            setSubTasks(prev => prev.filter(st => st.id !== deletedSubTask.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription for parent task:', parentTaskId);
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

  const handleReorderSubTasks = async (subTaskId: string, newIndex: number): Promise<void> => {
    if (!parentTaskId) return;

    const currentIndex = subTasks.findIndex(st => st.id === subTaskId);
    if (currentIndex === -1 || currentIndex === newIndex) return;

    // Optimistically update local state
    const reordered = [...subTasks];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(newIndex, 0, movedItem);
    setSubTasks(reordered);

    try {
      await subTaskService.reorderSubTasks(user?.id, parentTaskId, reordered);
    } catch (error) {
      console.error('Error reordering sub-tasks:', error);
      toast.error('Failed to reorder sub-tasks');
      // Revert on error
      setSubTasks(subTasks);
    }
  };

  const handlePromoteToTask = async (subTaskId: string): Promise<void> => {
    try {
      await subTaskService.promoteSubTaskToTask(user?.id, subTaskId);
      toast.success('Sub-task converted to main task');
    } catch (error) {
      console.error('Error promoting sub-task:', error);
      toast.error('Failed to convert sub-task');
    }
  };

  const handleMoveToTask = async (subTaskId: string, newParentId: string): Promise<void> => {
    try {
      await subTaskService.moveSubTaskToParent(user?.id, subTaskId, newParentId);
      toast.success('Sub-task moved');
    } catch (error) {
      console.error('Error moving sub-task:', error);
      toast.error('Failed to move sub-task');
    }
  };

  return {
    subTasks,
    isLoading,
    handleAddSubTask,
    handleToggleComplete,
    handleDeleteSubTask,
    handleReorderSubTasks,
    handlePromoteToTask,
    handleMoveToTask
  };
}
