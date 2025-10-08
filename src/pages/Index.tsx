
import React, { useCallback } from 'react';
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
              <TimerContainer />
            </div>
            
            <div className="w-full lg:w-1/2 border border-[hsl(var(--border))] rounded-lg p-6 bg-[hsl(var(--card))] min-h-[600px] flex flex-col overflow-hidden">
              <TaskManager />
            </div>
          </div>
          
          {!user && <AuthPrompt onSignupClick={handleSignupClick} />}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default Index;
