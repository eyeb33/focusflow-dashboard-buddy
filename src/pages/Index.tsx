
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

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timer');
  const { theme } = useTheme();
  
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
  
  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      theme === "dark" ? "bg-black text-white" : "bg-gray-100 text-gray-900"
    )}>
      <Header onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className={cn(
          "relative flex flex-col items-center justify-start py-4 px-4",
          theme === "dark" ? "bg-black" : "bg-gray-100"
        )}>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-md">
            <TabsList className={cn(
              "grid w-full grid-cols-2 mb-2",
              theme === "dark" ? "bg-[#1e293b]" : "bg-gray-200"
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
