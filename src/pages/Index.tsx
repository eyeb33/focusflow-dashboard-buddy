
import React, { useCallback, useState, useEffect, useRef } from 'react';
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
import CoachInterface from '@/components/Coach/CoachInterface';
import { useCoach } from '@/contexts/CoachContext';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { timerMode, setActiveTaskId, getElapsedMinutes, getElapsedSeconds, isRunning } = useTimerContext();
  const { tasks, isLoading, addTask, toggleComplete, editTask, deleteTask, setActiveTask: setTaskActive, updateTaskTime, reorderTasks } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isTasksVisible, setIsTasksVisible] = useState(true);
  const { toast } = useToast();
  const { triggerProactiveCoaching } = useCoach();
  const suppressRestoreRef = React.useRef<string | null>(null);

  // Restore active task from database after tasks load
  useEffect(() => {
    if (!isLoading && tasks.length > 0) {
      const currentActiveTask = tasks.find(t => t.isActive && !t.completed && t.id !== suppressRestoreRef.current);
      if (currentActiveTask && !activeTask) {
        setActiveTask(currentActiveTask);
        setActiveTaskId(currentActiveTask.id);
      }
    }
  }, [isLoading, tasks, activeTask, setActiveTaskId]);

  // Auto-hide tasks when timer starts, auto-show when paused
  useEffect(() => {
    if (isRunning && activeTask) {
      setIsTasksVisible(false);
    } else if (!isRunning) {
      setIsTasksVisible(true);
    }
  }, [isRunning, activeTask]);
  
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

  // Unified completion handler - saves time, clears active state, marks complete
  const completeTask = useCallback(async (id: string, showToast: boolean = false) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user) return;

    const isActiveTask = activeTask?.id === id;
    const elapsedMinutes = isActiveTask ? getElapsedMinutes() : 0;
    const elapsedSeconds = isActiveTask ? getElapsedSeconds() : 0;

    // Suppress restoration of this task while completion is processing
    suppressRestoreRef.current = id;

    // Clear from active zone immediately
    if (isActiveTask) {
      setActiveTask(null);
      setActiveTaskId(null);
    }

    try {
      // Always save time to ensure task appears on dashboard
      // Even if 0, this ensures timeSpent fields are set
      await updateTaskTime(id, elapsedMinutes, elapsedSeconds);

      // Mark complete and clear active status
      await toggleComplete(id);
      if (isActiveTask) {
        await setTaskActive(null);
      }

      // Show toast for active task completions
      if (showToast && isActiveTask) {
        const timeMessage = elapsedSeconds > 0 ? ` ${elapsedMinutes}m ${elapsedSeconds % 60}s tracked.` : '';
        toast({
          title: "Task completed",
          description: `Great work!${timeMessage}`,
        });
        
        // Trigger coach response for task completion
        if (user) {
          triggerProactiveCoaching('task_completed', {
            taskName: task.name,
            timeSpent: elapsedMinutes
          });
        }
      }
    } finally {
      // Clear suppression after state/queries have a chance to settle
      setTimeout(() => {
        if (suppressRestoreRef.current === id) suppressRestoreRef.current = null;
      }, 0);
    }
  }, [tasks, activeTask, user, getElapsedMinutes, getElapsedSeconds, updateTaskTime, toggleComplete, setTaskActive, setActiveTaskId, toast]);

  const handleToggleCompleteFromList = useCallback(async (id: string) => {
    await completeTask(id, false);
  }, [completeTask]);

  const handleCompleteActiveTask = useCallback(async () => {
    if (activeTask) {
      await completeTask(activeTask.id, true);
    }
  }, [activeTask, completeTask]);
  
  const getPageBackground = () => {
    if (theme === 'dark') return 'bg-gradient-to-b from-gray-900 via-gray-800 to-black';
    
    switch(timerMode) {
      case 'work': return 'bg-gradient-to-b from-[#df1515] via-[#ef6c47] to-[#ffa577]';
      case 'break': return 'bg-gradient-to-b from-[#738f66] via-[#a4c2a0] to-[#c8dcc4]';
      case 'longBreak': return 'bg-gradient-to-b from-[#a4c2b6] via-[#bdd9d0] to-[#d6ebe5]';
      default: return 'bg-gradient-to-b from-[#df1515] via-[#ef6c47] to-[#ffa577]';
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-500 relative overflow-hidden",
      getPageBackground()
    )}>
      {/* Decorative mountain silhouettes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Far mountains */}
        <svg className="absolute bottom-0 w-full h-[40%] opacity-20" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <polygon points="0,400 0,200 200,150 400,220 600,100 800,180 1000,140 1200,200 1200,400" fill="currentColor" className="text-black/30" />
        </svg>
        
        {/* Mid mountains */}
        <svg className="absolute bottom-0 w-full h-[35%] opacity-30" viewBox="0 0 1200 350" preserveAspectRatio="none">
          <polygon points="0,350 0,250 150,180 350,240 550,160 750,200 950,170 1200,220 1200,350" fill="currentColor" className="text-black/40" />
        </svg>
        
        {/* Near mountains/trees */}
        <svg className="absolute bottom-0 w-full h-[30%] opacity-60" viewBox="0 0 1200 300" preserveAspectRatio="none">
          <polygon points="0,300 0,280 100,220 200,240 300,200 400,260 500,210 600,250 700,190 800,230 900,200 1000,240 1100,220 1200,260 1200,300" fill="currentColor" className="text-black/60" />
        </svg>
        
        {/* Foreground trees */}
        <div className="absolute bottom-0 w-full h-[20%] bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="relative flex flex-col items-center h-full p-8">
          <div className={cn(
            "w-full h-full bg-white dark:bg-card rounded-3xl shadow-2xl p-8 flex flex-col gap-6 relative",
            "transition-all duration-700 ease-in-out",
            isTasksVisible ? "max-w-[85%]" : "max-w-[45%]"
          )}>
            <Header onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
            
            <div className="flex-1 flex gap-0 overflow-hidden">
              {/* Timer Section */}
              <div className={cn(
                "flex flex-col transition-all duration-500 ease-in-out",
                isTasksVisible ? "w-1/2" : "w-full"
              )}>
                <TimerContainer
                activeTask={activeTask}
                tasks={tasks}
                onRemoveActiveTask={handleRemoveActiveTask}
                onCompleteActiveTask={handleCompleteActiveTask}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onQuickAddTask={async (name) => {
                  return await addTask(name, 1);
                }}
                onSetActiveTask={async (taskId) => {
                  const task = tasks.find(t => t.id === taskId);
                  if (task) {
                    setActiveTask(task);
                    setActiveTaskId(taskId);
                    await setTaskActive(taskId);
                  }
                }}
              />
            </div>
            
            {/* Toggle Button - always on right edge of container */}
            <button
              onClick={() => setIsTasksVisible(!isTasksVisible)}
              className={cn(
                "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-30",
                "w-10 h-20 items-center justify-center",
                "bg-primary hover:bg-primary/90 active:bg-primary",
                "text-white shadow-lg hover:shadow-xl",
                "transition-all duration-500 ease-in-out",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "-right-5 rounded-l-xl"
              )}
              aria-label={isTasksVisible ? "Hide tasks" : "Show tasks"}
            >
              <svg
                className={cn(
                  "w-5 h-5 transition-transform duration-500",
                  isTasksVisible ? "rotate-0" : "rotate-180"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Tasks Section - slides in/out */}
            <div className={cn(
              "flex flex-col border-l border-border/20 pl-6 overflow-hidden",
              "transition-all duration-500 ease-in-out",
              isTasksVisible 
                ? "w-1/2 opacity-100" 
                : "w-0 opacity-0 pl-0 border-l-0"
            )}>
              <div className={cn(
                "transition-opacity duration-300",
                isTasksVisible ? "opacity-100 delay-200" : "opacity-0"
              )}>
                <TaskManagerWithDrop
                activeTaskId={activeTask?.id ?? null} 
                onDropToList={handleDropToList} 
                onDragOverList={handleDragOver}
                onReorderTasks={handleReorderTasks}
                tasks={tasks}
                isLoading={isLoading}
                addTask={addTask}
                toggleComplete={handleToggleCompleteFromList}
                editTask={editTask}
                  deleteTask={deleteTask}
                />
              </div>
            </div>
            </div>
          </div>
          
          {!user && <AuthPrompt onSignupClick={handleSignupClick} />}
        </div>
      </main>
      
      <MobileNav />
      {user && <CoachInterface />}
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
  addTask: (taskName: string, estimatedPomodoros: number) => Promise<string | null>;
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
    
    addTask(taskName, estimatedPomodoros).then(taskId => {
      if (taskId) {
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
                tasks={tasks.filter(t => !t.isActive && !t.completed)} 
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
