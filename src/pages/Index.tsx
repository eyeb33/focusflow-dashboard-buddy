
import React, { useCallback, useState, useEffect, useRef } from 'react';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
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
  const { timerMode, setActiveTaskId, getElapsedMinutes, getElapsedSeconds, isRunning, handleStart, activeTaskId } = useTimerContext();
  const { tasks, isLoading, addTask, toggleComplete, editTask, deleteTask, setActiveTask: setTaskActive, updateTaskTime, reorderTasks } = useTasks();
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  const suppressRestoreRef = React.useRef<string | null>(null);
  const tutorRef = useRef<MathsTutorInterfaceRef>(null);
  const [linkedTaskIds, setLinkedTaskIds] = useState<Set<string>>(new Set());

  // Slot for portaling the tutor input into the shared grid bottom row
  const [chatInputSlot, setChatInputSlot] = useState<HTMLDivElement | null>(null);

  // Get the active task from tasks list based on activeTaskId
  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  // Handle clicking on a study topic - opens chat, sets as active, and starts timer
  const handleTaskClick = useCallback(async (taskId: string, taskName: string) => {
    // 1. Open the chat session
    tutorRef.current?.openTaskSession(taskId, taskName);
    
    // 2. Set this task as active
    setActiveTaskId(taskId);
    await setTaskActive(taskId).catch(console.error);
    
    // 3. Auto-start the timer if not already running
    if (!isRunning) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        handleStart();
      }, 100);
    }
    
    // Optimistically update linked task IDs
    setLinkedTaskIds(prev => new Set([...prev, taskId]));
  }, [setActiveTaskId, setTaskActive, isRunning, handleStart]);

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
    if (!isLoading && tasks.length > 0 && !activeTaskId) {
      const currentActiveTask = tasks.find(t => t.isActive && !t.completed && t.id !== suppressRestoreRef.current);
      if (currentActiveTask) {
        setActiveTaskId(currentActiveTask.id);
      }
    }
  }, [isLoading, tasks, activeTaskId, setActiveTaskId]);

  
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleReorderTasks = useCallback((newOrderedTasks: any[]) => {
    reorderTasks(newOrderedTasks);
  }, [reorderTasks]);

  // Unified completion handler - saves time, clears active state, marks complete
  const completeTask = useCallback(async (id: string, showToast: boolean = false) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !user) return;

    const isCurrentlyActive = activeTaskId === id;
    const elapsedMinutes = isCurrentlyActive ? getElapsedMinutes() : 0;
    const elapsedSeconds = isCurrentlyActive ? getElapsedSeconds() : 0;

    // Suppress restoration of this task while completion is processing
    suppressRestoreRef.current = id;

    // Clear active state immediately
    if (isCurrentlyActive) {
      setActiveTaskId(null);
    }

    try {
      // Always save time to ensure task appears on dashboard
      await updateTaskTime(id, elapsedMinutes, elapsedSeconds);

      // Mark complete and clear active status
      await toggleComplete(id);
      if (isCurrentlyActive) {
        await setTaskActive(null);
      }

      // Show toast for active task completions
      if (showToast && isCurrentlyActive) {
        const timeMessage = elapsedSeconds > 0 ? ` ${elapsedMinutes}m ${elapsedSeconds % 60}s tracked.` : '';
        toast({
          title: "Task completed",
          description: `Great work!${timeMessage}`,
        });
      }
    } finally {
      // Clear suppression after state/queries have a chance to settle
      setTimeout(() => {
        if (suppressRestoreRef.current === id) suppressRestoreRef.current = null;
      }, 0);
    }
  }, [tasks, activeTaskId, user, getElapsedMinutes, getElapsedSeconds, updateTaskTime, toggleComplete, setTaskActive, setActiveTaskId, toast]);

  const handleToggleCompleteFromList = useCallback((id: string) => {
    setCompletingTaskId(id);
    setTimeout(() => {
      completeTask(id, false);
      setTimeout(() => setCompletingTaskId(null), 300);
    }, 400);
  }, [completeTask]);
  
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
            
            <div className="mt-4 flex-1 min-h-0 overflow-hidden">
              {/* Two-column GRID with shared bottom row for perfect input alignment */}
              <div className={cn(
                "grid h-full min-h-0",
                user 
                  ? "grid-cols-[2fr_3fr] grid-rows-[1fr_auto] gap-x-0 gap-y-4"
                  : "grid-cols-1 grid-rows-[1fr_auto] gap-4"
              )}>
                {/* Left Column: Timer + Topics (row 1, col 1) */}
                <div className="min-h-0 overflow-hidden flex flex-col pr-6">
                  <div className="flex-shrink-0">
                    <TimerContainer
                      activeTask={activeTask}
                    />
                  </div>

                  <div className="flex-1 flex flex-col pt-4 min-h-0 overflow-hidden">
                    <TaskManagerWithDrop
                      activeTaskId={activeTaskId} 
                      onDragOverList={handleDragOver}
                      onReorderTasks={handleReorderTasks}
                      tasks={tasks}
                      isLoading={isLoading}
                      toggleComplete={handleToggleCompleteFromList}
                      editTask={editTask}
                      deleteTask={deleteTask}
                      completingTaskId={completingTaskId}
                      onTaskClick={handleTaskClick}
                      linkedTaskIds={tutorRef.current?.linkedTaskIds || linkedTaskIds}
                    />
                  </div>
                </div>

                {/* Right Column: Tutor (row 1, col 2) */}
                {user && (
                  <div className="min-h-0 overflow-hidden pl-6 flex flex-col">
                    <MathsTutorInterface ref={tutorRef} inputPortalTarget={chatInputSlot} />
                  </div>
                )}

                {/* Bottom row (row 2): Task input (col 1) */}
                <div className={cn(
                  "flex-shrink-0 py-4 border-t border-border bg-background/80",
                  user ? "pr-6" : ""
                )}>
                  <TaskInput onAddTask={(taskName, estimatedPomodoros) => {
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
                  }} />
                </div>

                {/* Bottom row (row 2): Chat input slot (col 2) */}
                {user && (
                  <div ref={setChatInputSlot} className="flex-shrink-0 pl-6" />
                )}
              </div>
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
  onDragOverList: (e: React.DragEvent) => void;
  onReorderTasks: (newOrderedTasks: any[]) => void;
  activeTaskId?: string | null;
  tasks: Task[];
  isLoading: boolean;
  toggleComplete: (id: string) => void;
  editTask: (id: string, name: string, estimatedPomodoros: number) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  completingTaskId: string | null;
  onTaskClick?: (taskId: string, taskName: string) => void;
  linkedTaskIds?: Set<string>;
}> = ({ onDragOverList, onReorderTasks, activeTaskId, tasks, isLoading, toggleComplete, editTask, deleteTask, completingTaskId, onTaskClick, linkedTaskIds }) => {
  const [editingTask, setEditingTask] = React.useState<any>(null);
  const [editName, setEditName] = React.useState('');
  const [editPomodoros, setEditPomodoros] = React.useState(1);
  const { toast } = useToast();

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
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

          <TaskList 
            tasks={tasks.filter(t => !t.completed)} 
            onDeleteTask={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
            onDragOverList={onDragOverList}
            onReorderTasks={onReorderTasks}
            completingTaskId={completingTaskId}
            onTaskClick={onTaskClick}
            linkedTaskIds={linkedTaskIds}
            activeTaskId={activeTaskId}
          />

          <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        </div>
      )}
    </div>
  );
};

export default Index;
