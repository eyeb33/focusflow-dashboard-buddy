
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import CircularProgress from "@/components/Timer/CircularProgress";
import TimerControls from "@/components/Timer/TimerControls";
import TimerSettings from "@/components/Timer/TimerSettings";
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import TaskManager from "@/components/Tasks/TaskManager";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timerMode, setTimerMode] = useState<'work' | 'break' | 'longBreak'>('work');
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [workDuration, setWorkDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [longBreakDuration, setLongBreakDuration] = useState(15); // minutes
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(4);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  const [activeTab, setActiveTab] = useState('timer');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const getTotalTime = () => {
    switch (timerMode) {
      case 'break':
        return breakDuration * 60;
      case 'longBreak':
        return longBreakDuration * 60;
      case 'work':
      default:
        return workDuration * 60;
    }
  };

  useEffect(() => {
    setTimeRemaining(getTotalTime());
  }, [timerMode, workDuration, breakDuration, longBreakDuration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as ReturnType<typeof setInterval>);
            
            if (timerMode === 'work') {
              const newCompletedSessions = completedSessions + 1;
              setCompletedSessions(newCompletedSessions);
              setTotalTimeToday(prev => prev + workDuration);
              
              // Save completed session to Supabase if user is logged in
              if (user) {
                saveFocusSession(workDuration * 60, true);
              }
              
              if (newCompletedSessions % sessionsUntilLongBreak === 0) {
                setTimerMode('longBreak');
              } else {
                setTimerMode('break');
              }
            } else {
              // Save break session to Supabase if user is logged in
              if (user) {
                saveFocusSession(
                  timerMode === 'break' ? breakDuration * 60 : longBreakDuration * 60, 
                  true
                );
              }
              
              setTimerMode('work');
            }
            
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerMode]);

  // Function to save a focus session to Supabase
  const saveFocusSession = async (duration: number, completed: boolean) => {
    try {
      if (user) {
        const { error } = await supabase.from('focus_sessions').insert({
          user_id: user.id,
          session_type: timerMode,
          duration: duration,
          completed: completed
        });
        
        if (error) {
          console.error('Error saving session:', error);
        } else {
          console.log('Session saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const progress = 1 - (timeRemaining / getTotalTime());

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeRemaining(getTotalTime());
  };
  const handleSkip = () => {
    setIsRunning(false);
    if (timerMode === 'work') {
      // Save skipped work session
      if (user) {
        const elapsedTime = getTotalTime() - timeRemaining;
        if (elapsedTime > 0) {
          saveFocusSession(elapsedTime, false);
        }
      }
      setTimerMode(completedSessions % sessionsUntilLongBreak === sessionsUntilLongBreak - 1 ? 'longBreak' : 'break');
    } else {
      // Save skipped break session
      if (user) {
        const elapsedTime = getTotalTime() - timeRemaining;
        if (elapsedTime > 0) {
          saveFocusSession(elapsedTime, false);
        }
      }
      setTimerMode('work');
    }
  };
  
  const handleModeChange = (mode: 'work' | 'break' | 'longBreak') => {
    // Save the current session if it was in progress
    if (isRunning && user) {
      const elapsedTime = getTotalTime() - timeRemaining;
      if (elapsedTime > 0) {
        saveFocusSession(elapsedTime, false);
      }
    }
    setIsRunning(false);
    setTimerMode(mode);
  };
  
  const getModeLabel = () => {
    switch (timerMode) {
      case 'break':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      case 'work':
      default:
        return 'Focus';
    }
  };
  
  const handleLoginClick = () => {
    navigate('/auth', { state: { mode: 'login' } });
  };
  
  const handleSignupClick = () => {
    navigate('/auth', { state: { mode: 'signup' } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onLoginClick={handleLoginClick} 
        onSignupClick={handleSignupClick}
      />
      
      <main className="flex-1 flex flex-col">
        <div className="relative flex flex-col items-center justify-center flex-1 px-4 py-8 md:py-16 timer-gradient">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="timer">Timer</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timer">
              <Card className="w-full max-w-md p-6 bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <Tabs 
                    value={timerMode} 
                    onValueChange={(v) => handleModeChange(v as 'work' | 'break' | 'longBreak')}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="work">Focus</TabsTrigger>
                      <TabsTrigger value="break">Break</TabsTrigger>
                      <TabsTrigger value="longBreak">Long Break</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <TimerSettings
                    workDuration={workDuration}
                    breakDuration={breakDuration}
                    longBreakDuration={longBreakDuration}
                    sessionsUntilLongBreak={sessionsUntilLongBreak}
                    onWorkDurationChange={setWorkDuration}
                    onBreakDurationChange={setBreakDuration}
                    onLongBreakDurationChange={setLongBreakDuration}
                    onSessionsUntilLongBreakChange={setSessionsUntilLongBreak}
                  />
                </div>
                
                <div className="flex flex-col items-center">
                  <Badge variant="outline" className="mb-4">
                    {getModeLabel()}
                  </Badge>
                  
                  <CircularProgress 
                    progress={progress} 
                    mode={timerMode}
                    size={260}
                    className="mb-6"
                  >
                    <div className="text-center">
                      <div className="text-5xl font-bold tracking-tighter">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        {timerMode === 'work' ? "Focus on your task" : "Take a break"}
                      </div>
                    </div>
                  </CircularProgress>
                  
                  <TimerControls
                    isRunning={isRunning}
                    onStart={handleStart}
                    onPause={handlePause}
                    onReset={handleReset}
                    onSkip={handleSkip}
                    className="mb-2"
                  />
                </div>
                
                <div className="mt-8 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">{completedSessions}</div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{totalTimeToday}</div>
                    <div className="text-xs text-muted-foreground">Minutes</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">
                      {Math.floor(completedSessions / sessionsUntilLongBreak)}
                    </div>
                    <div className="text-xs text-muted-foreground">Rounds</div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="tasks">
              <div className="w-full max-w-md">
                <TaskManager />
              </div>
            </TabsContent>
          </Tabs>
          
          {!user && (
            <div className="max-w-xl text-center mt-8 px-4">
              <h2 className="text-xl font-semibold mb-2">Track your productivity</h2>
              <p className="text-muted-foreground mb-6">
                Sign up to track your progress, analyze your productivity patterns, and improve your focus habits over time.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button onClick={handleSignupClick} className="bg-pomodoro-work hover:bg-pomodoro-work/90">
                  Start Tracking
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  View Demo Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default Index;
