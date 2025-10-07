
import React, { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timer');
  const { theme } = useTheme();
  const { timerMode } = useTimerContext();
  
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
  
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);
  
  const getPageBackground = () => {
    if (theme === 'dark') return 'bg-black text-white';
    if (activeTab !== 'timer') return 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))]';
    
    switch(timerMode) {
      case 'work': return 'bg-[hsl(var(--timer-focus-bg))] text-[hsl(var(--foreground))]';
      case 'break': return 'bg-[hsl(var(--timer-break-bg))] text-[hsl(var(--foreground))]';
      case 'longBreak': return 'bg-[hsl(var(--timer-longbreak-bg))] text-[hsl(var(--foreground))]';
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-md">
            <TabsList className={cn(
              "grid w-full grid-cols-2 mb-2",
              theme === "dark" ? "bg-[#1e293b]" : "bg-white/40 backdrop-blur-sm"
            )}>
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timer" className="w-full">
              <TimerContainer />
            </TabsContent>
            
            <TabsContent value="tasks">
              <div className="w-full max-w-md">
                <TaskManager />
              </div>
            </TabsContent>
          </Tabs>
          
          {!user && <AuthPrompt onSignupClick={handleSignupClick} />}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default Index;
