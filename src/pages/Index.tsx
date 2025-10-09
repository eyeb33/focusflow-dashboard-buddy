
import React, { useCallback, useState, useEffect } from 'react';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import TaskManager from "@/components/Tasks/TaskManager";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import TimerContainer from "@/components/Timer/TimerContainer";
import AuthPrompt from "@/components/Auth/AuthPrompt";
import { useTheme } from "@/components/Theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { useTimerContext } from '@/contexts/TimerContext';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import TaskInput from '@/components/Tasks/TaskInput';
import TaskList from '@/components/Tasks/TaskList';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { timerMode, setActiveTaskId, getElapsedMinutes } = useTimerContext();
  const { tasks, isLoading, addTask, toggleComplete, editTask, deleteTask, setActiveTask: setTaskActive, updateTaskTime, reorderTasks } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Restore active task from database after tasks load
  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      const currentActiveTask = tasks.find(t => t.isActive);
      if (currentActiveTask && !activeTask) {
        setActiveTask(currentActiveTask);
        setActiveTaskId(currentActiveTask.id);
      }
    }
  }, [isLoading, tasks, setActiveTaskId]);
  
  const handleLoginClick = useCallback(() => {
    navigate('/auth', {
      state: {
        mode: 'login'
      }
    });
  }, [navigate]);
  
  const handleSignupClick = useCallback(() => {
    navigate('/auth', {
      state: {
        mode: 'signup'
      }
    });
  }, [navigate]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && !task.completed) {
      // Instant UI update
      setActiveTask(task);
      setActiveTaskId(taskId);
      // Database update in background (non-blocking)
      setTaskActive(taskId).catch(console.error);
    }
  }, [tasks, setTaskActive, setActiveTaskId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleRemoveActiveTask = useCallback(() => {
    setActiveTask(null);
    setTaskActive(null);
    setActiveTaskId(null);
  }, [setTaskActive, setActiveTaskId]);

  const handleDropToList = useCallback((e: React.DragEvent, dropIndex: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    const activeTaskId = e.dataTransfer.getData('activeTaskId');
    if (activeTaskId) {
      // Get the active task and clear its active flag
      const returnedTask = tasks.find(t => t.id === activeTaskId);
      if (returnedTask) {
        // Get all non-active tasks (what's currently visible in the list)
        const visibleTasks = tasks.filter(t => t.id !== activeTaskId && !t.isActive);
        
        // Insert the returned task at the dropIndex with isActive cleared
        const insertAt = dropIndex !== null ? dropIndex : visibleTasks.length;
        const taskToInsert = { ...returnedTask, isActive: false };
        const newOrderedTasks = [
          ...visibleTasks.slice(0, insertAt),
          taskToInsert,
          ...visibleTasks.slice(insertAt)
        ];
        
        // First clear active task in UI
        setActiveTask(null);
        setActiveTaskId(null);
        
        // Then reorder with the new position
        reorderTasks(newOrderedTasks);
        
        // Database update in background (non-blocking)
        setTaskActive(null).catch(console.error);
        
        toast({
          title: "Task returned to list",
          description: "Time spent has been saved",
        });
      }
    }
  }, [tasks, setTaskActive, setActiveTaskId, reorderTasks, toast]);

  const handleReorderTasks = useCallback((newOrderedTasks: any[]) => {
    reorderTasks(newOrderedTasks);
  }, [reorderTasks]);

  const handleCompleteActiveTask = useCallback(async () => {
    if (activeTask && user) {
      // Get elapsed time before completing
      const elapsedMinutes = getElapsedMinutes();
      const taskId = activeTask.id;
      
      // Clear active task immediately from UI
      setActiveTask(null);
      setActiveTaskId(null);
      
      // Update task time if any time has elapsed
      if (elapsedMinutes > 0) {
        updateTaskTime(taskId, elapsedMinutes).catch(console.error);
      }
      
      // Database updates in background (non-blocking)
      toggleComplete(taskId).catch(console.error);
      setTaskActive(null).catch(console.error);
      
      const timeMessage = elapsedMinutes > 0 ? ` ${elapsedMinutes} min tracked.` : '';
      toast({
        title: "Task completed",
        description: `Great work!${timeMessage}`,
      });
    }
  }, [activeTask, user, toggleComplete, setTaskActive, setActiveTaskId, updateTaskTime, getElapsedMinutes, toast]);
  
  const getPageBackground = () => {
    if (theme === 'dark') return 'bg-black text-white';
    
    switch(timerMode) {
      case 'work': return 'bg-[hsl(var(--timer-focus-bg))] text-[hsl(var(--foreground))]';
      case 'break': return 'bg-[hsl(var(--timer-break-bg))] text-[hsl(var(--primary-foreground))]';
      case 'longBreak': return 'bg-[hsl(var(--timer-longbreak-bg))] text-[hsl(var(--primary-foreground))]';
      default: return 'bg-[hsl(var(--timer-focus-bg))] text-[hsl(var(--foreground))]';
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-500",
      getPageBackground()
    )}>
      <Header onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className={cn(
          "relative flex flex-col items-center justify-start py-4 px-4"
        )}>
          <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-4 items-stretch">
            <div className="w-full lg:w-1/2 border border-[hsl(var(--border))] rounded-lg p-6 bg-[hsl(var(--card))] min-h-[600px] flex flex-col">
              <TimerContainer 
                activeTask={activeTask}
                onRemoveActiveTask={handleRemoveActiveTask}
                onCompleteActiveTask={handleCompleteActiveTask}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              />
            </div>
            
            <div className="w-full lg:w-1/2 border border-[hsl(var(--border))] rounded-lg p-6 bg-[hsl(var(--card))] min-h-[600px] flex flex-col overflow-hidden">
              <TaskManagerWithDrop 
                activeTaskId={activeTask?.id ?? null} 
                onDropToList={handleDropToList} 
                onDragOverList={handleDragOver}
                onReorderTasks={handleReorderTasks}
                tasks={tasks}
                isLoading={isLoading}
                addTask={addTask}
                toggleComplete={toggleComplete}
                editTask={editTask}
                deleteTask={deleteTask}
              />
            </div>
          </div>
          
          {!user && <AuthPrompt onSignupClick={handleSignupClick} />}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

// Wrapper component to pass drop handlers to TaskManager
const TaskManagerWithDrop: React.FC<{ 
  onDropToList: (e: React.DragEvent, dropIndex: number | null) => void;
  onDragOverList: (e: React.DragEvent) => void;
  onReorderTasks: (newOrderedTasks: any[]) => void;
  activeTaskId?: string | null;
  tasks: Task[];
  isLoading: boolean;
  addTask: (taskName: string, estimatedPomodoros: number) => Promise<boolean>;
  toggleComplete: (id: string) => Promise<void> | void;
  editTask: (id: string, name: string, estimatedPomodoros: number) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}> = ({ onDropToList, onDragOverList, onReorderTasks, activeTaskId, tasks, isLoading, addTask, toggleComplete, editTask, deleteTask }) => {
  const [editingTask, setEditingTask] = React.useState<any>(null);
  const [editName, setEditName] = React.useState('');
  const [editPomodoros, setEditPomodoros] = React.useState(1);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddTask = (taskName: string, estimatedPomodoros: number) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add tasks.",
        variant: "destructive",
      });
      return;
    }
    
    addTask(taskName, estimatedPomodoros).then(success => {
      if (success) {
        toast({
          title: "Task added",
          description: `"${taskName}" has been added to your tasks`,
        });
      }
    });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id).then(success => {
      if (success) {
        toast({
          title: "Task deleted",
          description: "The task has been removed",
        });
      }
    });
  };

  const handleToggleComplete = (id: string) => {
    toggleComplete(id);
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
      editTask(editingTask.id, editName, editPomodoros).then(success => {
        if (success) {
          setEditingTask(null);
          toast({
            title: "Task updated",
            description: "Your task has been updated",
          });
        }
      });
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col">
        <div className="pb-3">
          <h2 className="text-2xl font-bold">Tasks</h2>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <TaskInput onAddTask={handleAddTask} />
          
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto mt-4">
              <TaskList 
                tasks={tasks.filter(t => !t.isActive)} 
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onDropToList={onDropToList}
                onDragOverList={onDragOverList}
                onReorderTasks={onReorderTasks}
              />
            </div>
          )}
          
          {!user && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Sign in to save and sync your tasks across devices</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
