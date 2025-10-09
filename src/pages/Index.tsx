
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
  const { timerMode, setActiveTaskId } = useTimerContext();
  const { tasks, setActiveTask: setTaskActive, toggleComplete } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { toast } = useToast();

  // Sync active task from tasks array
  useEffect(() => {
    const currentActiveTask = tasks.find(t => t.isActive);
    if (currentActiveTask) {
      setActiveTask(currentActiveTask);
    } else if (activeTask && !tasks.find(t => t.id === activeTask.id && t.isActive)) {
      // If the active task is no longer active in the database, clear it
      setActiveTask(null);
      setActiveTaskId(null);
    }
  }, [tasks, activeTask, setActiveTaskId]);
  
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
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && !task.completed) {
      setActiveTask(task);
      setTaskActive(taskId);
      setActiveTaskId(taskId);
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

  const handleDropToList = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const activeTaskId = e.dataTransfer.getData('activeTaskId');
    if (activeTaskId && user) {
      await setTaskActive(null);
      setActiveTask(null);
      setActiveTaskId(null);
      toast({
        title: "Task returned to list",
        description: "Time spent has been saved",
      });
    }
  }, [user, setTaskActive, setActiveTaskId, toast]);

  const handleCompleteActiveTask = useCallback(async () => {
    if (activeTask && user) {
      await toggleComplete(activeTask.id);
      await setTaskActive(null);
      setActiveTask(null);
      setActiveTaskId(null);
      toast({
        title: "Task completed",
        description: "Great work! Task moved to dashboard.",
      });
    }
  }, [activeTask, user, toggleComplete, setTaskActive, setActiveTaskId, toast]);
  
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
              <TaskManagerWithDrop onDropToList={handleDropToList} onDragOverList={handleDragOver} />
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
  onDropToList: (e: React.DragEvent) => void;
  onDragOverList: (e: React.DragEvent) => void;
}> = ({ onDropToList, onDragOverList }) => {
  const [editingTask, setEditingTask] = React.useState<any>(null);
  const [editName, setEditName] = React.useState('');
  const [editPomodoros, setEditPomodoros] = React.useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const { tasks, isLoading, addTask, toggleComplete, editTask, deleteTask } = useTasks();

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
                tasks={tasks} 
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleEditTask}
                onDropToList={onDropToList}
                onDragOverList={onDragOverList}
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
