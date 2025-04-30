import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import TaskManager from "@/components/Tasks/TaskManager";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
// REMOVE this if you're no longer using TimerContainer
// import TimerContainer from "@/components/Timer/TimerContainer";
import AuthPrompt from "@/components/Auth/AuthPrompt";
import PomodoroTimer from "@/components/Timer/PomodoroTimer";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('timer');
  
  const handleLoginClick = () => {
    navigate('/auth', {
      state: {
        mode: 'login'
      }
    });
  };
  
  const handleSignupClick = () => {
    navigate('/auth', {
      state: {
        mode: 'signup'
      }
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
      
      <main className="flex-1 flex flex-col">
        <div className="relative flex flex-col items-center justify-center flex-1 px-4 py-8 md:py-16 bg-white dark:bg-black">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timer" className="w-full">
              <PomodoroTimer />
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
