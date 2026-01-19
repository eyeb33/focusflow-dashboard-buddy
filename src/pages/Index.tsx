
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
import MathsTutorInterface, { MathsTutorInterfaceRef } from '@/components/Tutor/MathsTutorInterface';

import bgWork from '@/assets/bg-work.png';
import bgBreak from '@/assets/bg-break.png';
import bgLongBreak from '@/assets/bg-longbreak.png';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { timerMode, setActiveTaskId, getElapsedMinutes, getElapsedSeconds, isRunning } = useTimerContext();
  const { tasks, isLoading, addTask, toggleComplete, editTask, deleteTask, setActiveTask: setTaskActive, updateTaskTime, reorderTasks } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const suppressRestoreRef = React.useRef<string | null>(null);
  const tutorRef = useRef<MathsTutorInterfaceRef>(null);
  const [linkedTaskIds, setLinkedTaskIds] = useState<Set<string>>(new Set());

  // Handle clicking on a study topic to open its chat session
  const handleTaskClick = useCallback((taskId: string, taskName: string) => {
    tutorRef.current?.openTaskSession(taskId, taskName);
    // Optimistically update linked task IDs
    setLinkedTaskIds(prev => new Set([...prev, taskId]));
  }, []);

  // Sync linkedTaskIds from the tutor component when it updates
  useEffect(() => {
    const syncLinkedIds = () => {
      if (tutorRef.current?.linkedTaskIds) {
        setLinkedTaskIds(tutorRef.current.linkedTaskIds);
      }
    };
    // Initial sync after a short delay for ref to be populated
    const timer = setTimeout(syncLinkedIds, 500);
    return () => clearTimeout(timer);
  }, [user]);

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
        
        // NOTE: We intentionally do NOT trigger any AI calls here.
        // Gemini requests must only happen when the user explicitly clicks Send in the tutor chat.
        // (This avoids unexpected background calls that can burn the 15 RPM free-tier quota.)
      }
    } finally {
      // Clear suppression after state/queries have a chance to settle
      setTimeout(() => {
        if (suppressRestoreRef.current === id) suppressRestoreRef.current = null;
      }, 0);
    }
  }, [tasks, activeTask, user, getElapsedMinutes, getElapsedSeconds, updateTaskTime, toggleComplete, setTaskActive, setActiveTaskId, toast]);

  const handleToggleCompleteFromList = useCallback((id: string) => {
    setCompletingTaskId(id);
    setTimeout(() => {
      completeTask(id, false);
      setTimeout(() => setCompletingTaskId(null), 300);
    }, 400);
  }, [completeTask]);

  const handleCompleteActiveTask = useCallback(async () => {
    if (activeTask) {
      await completeTask(activeTask.id, true);
    }
  }, [activeTask, completeTask]);
  
  const getPageBackground = () => {
    // Always use images for backgrounds, dark mode will have overlay
    switch(timerMode) {
      case 'work': return bgWork;
      case 'break': return bgBreak;
      case 'longBreak': return bgLongBreak;
      default: return bgWork;
    }
  };

  const background = getPageBackground();

  return (
    <div 
      className="min-h-screen flex flex-col transition-colors duration-500 relative overflow-hidden"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for dark mode + gradient fade to top */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-colors duration-500",
        theme === 'dark' 
          ? "bg-gradient-to-t from-black/90 via-black/85 to-black/80" 
          : "bg-gradient-to-t from-transparent via-transparent to-white/30"
      )} />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <div className="relative flex flex-col items-center justify-start py-6 px-4 md:px-8 h-full">
          <div className="w-full max-w-[92%] mx-auto bg-white dark:bg-card rounded-3xl shadow-2xl p-6 flex flex-col relative h-[calc(100vh-80px)]">

            <Header onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
            
            <div className="flex-1 flex gap-6 mt-4 min-h-0 overflow-hidden">
              {/* Left Column: Timer + Tasks (40%) - Fixed height with internal scroll */}
              <div className="flex flex-col w-2/5 gap-4 overflow-hidden">
                {/* Timer Section - Fixed */}
                <div className="flex-shrink-0">
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
              
                {/* Study Topics Section - Scrollable */}
                <div className="flex flex-col flex-1 border-t border-border/20 pt-4 min-h-0 overflow-hidden">
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
                    completingTaskId={completingTaskId}
                    onTaskClick={handleTaskClick}
                    linkedTaskIds={tutorRef.current?.linkedTaskIds || linkedTaskIds}
                  />
                </div>
              </div>
              
              {/* Right Column: Maths Tutor (60%) - Fixed container with internal scroll */}
              {user && (
                <div className="flex flex-col w-3/5 border-l border-border/20 pl-6 min-h-0 overflow-hidden">
                  <MathsTutorInterface ref={tutorRef} />
                </div>
              )}
            </div>
          </div>
          
          {!user && <AuthPrompt onSignupClick={handleSignupClick} />}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

const TaskManagerWithDrop: React.FC<{ 
  onDropToList: (e: React.DragEvent, dropIndex: number | null) => void;
  onDragOverList: (e: React.DragEvent) => void;
  onReorderTasks: (newOrderedTasks: any[]) => void;
  activeTaskId?: string | null;
  tasks: Task[];
  isLoading: boolean;
  addTask: (taskName: string, estimatedPomodoros: number) => Promise<string | null>;
  toggleComplete: (id: string) => void;
  editTask: (id: string, name: string, estimatedPomodoros: number) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  completingTaskId: string | null;
  onTaskClick?: (taskId: string, taskName: string) => void;
  linkedTaskIds?: Set<string>;
}> = ({ onDropToList, onDragOverList, onReorderTasks, activeTaskId, tasks, isLoading, addTask, toggleComplete, editTask, deleteTask, completingTaskId, onTaskClick, linkedTaskIds }) => {
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="pb-2 flex-shrink-0">
        <h2 className="text-xl font-display font-semibold tracking-tight">Study Topics</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3 flex-1">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-full h-16" />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable topics list */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

            <TaskList 
              tasks={tasks.filter(t => !t.isActive && !t.completed)} 
              onDeleteTask={handleDeleteTask}
              onToggleComplete={handleToggleComplete}
              onEditTask={handleEditTask}
              onDropToList={onDropToList}
              onDragOverList={onDragOverList}
              onReorderTasks={onReorderTasks}
              completingTaskId={completingTaskId}
              onTaskClick={onTaskClick}
              linkedTaskIds={linkedTaskIds}
            />

            <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
          </div>

          {/* Fixed input at bottom */}
          <div className="flex-shrink-0 pt-3 border-t border-border/50">
            <TaskInput onAddTask={handleAddTask} />
          </div>
        </div>
      )}

      {!user && (
        <div className="text-center py-4 text-muted-foreground flex-shrink-0">
          <p>Sign in to save and sync your tasks across devices</p>
        </div>
      )}
    </div>
  );
};

export default Index;
