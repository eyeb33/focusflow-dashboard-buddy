
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import MathsTutorInterface, { MathsTutorInterfaceRef } from '@/components/Tutor/MathsTutorInterface';
import CurriculumTopicList from '@/components/Curriculum/CurriculumTopicList';
import { useCurriculumTopics } from '@/hooks/useCurriculumTopics';
import { Task } from '@/types/task';

import bgWork from '@/assets/bg-work.png';
import bgBreak from '@/assets/bg-break.png';
import bgLongBreak from '@/assets/bg-longbreak.png';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { timerMode, setActiveTaskId, getElapsedMinutes, getElapsedSeconds, isRunning, handleStart, activeTaskId } = useTimerContext();
  const { toast } = useToast();

  const tutorRef = useRef<MathsTutorInterfaceRef>(null);
  const [linkedTaskIds, setLinkedTaskIds] = useState<Set<string>>(new Set());

  // Curriculum topics hook
  const {
    categorizedTopics,
    topicsWithSessions,
    categoryProgress,
    isLoading: isCurriculumLoading,
    activeTopicId,
    activeSession,
    toggleCategory,
    getOrCreateSession,
    setTopicActive,
    updateSessionTime,
    toggleSubtopicComplete
  } = useCurriculumTopics();

  // Slot for portaling the tutor input into the shared grid bottom row
  const [chatInputSlot, setChatInputSlot] = useState<HTMLDivElement | null>(null);

  // Handle clicking on a curriculum topic - opens chat, sets as active, and starts timer
  const handleTopicClick = useCallback(async (topicId: string, topicName: string) => {
    // 1. Ensure session exists for this topic
    const session = await getOrCreateSession(topicId, topicName);
    if (!session) return;

    // 2. Open the chat session with the topic
    tutorRef.current?.openTaskSession(topicId, topicName);
    
    // 3. Set this topic as active in both curriculum and timer contexts
    await setTopicActive(topicId);
    setActiveTaskId(topicId);
    
    // 4. Auto-start the timer if not already running
    if (!isRunning) {
      setTimeout(() => {
        handleStart();
      }, 100);
    }
    
    // Optimistically update linked task IDs
    setLinkedTaskIds(prev => new Set([...prev, topicId]));
  }, [getOrCreateSession, setTopicActive, setActiveTaskId, isRunning, handleStart]);

  // Handle subtopic completion toggle
  const handleSubtopicToggle = useCallback(async (topicId: string, subtopic: string) => {
    await toggleSubtopicComplete(topicId, subtopic);
  }, [toggleSubtopicComplete]);

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

  // Restore active topic from curriculum session after load
  useEffect(() => {
    if (!isCurriculumLoading && activeSession && !activeTaskId) {
      setActiveTaskId(activeSession.topicId);
    }
  }, [isCurriculumLoading, activeSession, activeTaskId, setActiveTaskId]);

  // Save timer time to topic session when timer stops or topic changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunning && activeTopicId) {
        const elapsedSeconds = getElapsedMinutes() * 60 + getElapsedSeconds();
        if (elapsedSeconds > 0) {
          updateSessionTime(activeTopicId, elapsedSeconds);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRunning, activeTopicId, getElapsedMinutes, getElapsedSeconds, updateSessionTime]);

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
    switch(timerMode) {
      case 'work': return bgWork;
      case 'break': return bgBreak;
      case 'longBreak': return bgLongBreak;
      default: return bgWork;
    }
  };

  const background = getPageBackground();

  // Create a mock active task for the timer to display
  const activeTask: Task | null = activeSession ? {
    id: activeSession.topicId,
    name: activeSession.topicName,
    estimatedPomodoros: 1,
    completed: false,
    completedPomodoros: 0,
    isActive: true,
    timeSpent: Math.floor(activeSession.totalTimeSeconds / 60),
    timeSpentSeconds: activeSession.totalTimeSeconds,
    createdAt: activeSession.createdAt,
    updatedAt: activeSession.updatedAt
  } : null;

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
                {/* Left Column: Timer + Curriculum Topics (row 1, col 1) */}
                <div className="min-h-0 overflow-hidden flex flex-col pr-6">
                  <div className="flex-shrink-0">
                    <TimerContainer
                      activeTask={activeTask}
                    />
                  </div>

                  <div className="flex-1 flex flex-col pt-4 min-h-0 overflow-hidden">
                    <div className="pb-2 flex-shrink-0">
                      <h2 className="text-xl font-display font-semibold tracking-tight">A-Level Maths Curriculum</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Edexcel Specification</p>
                    </div>
                    
                    <div className="flex-1 min-h-0 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
                      
                      <CurriculumTopicList
                        categories={categorizedTopics}
                        topicsWithSessions={topicsWithSessions}
                        categoryProgress={categoryProgress}
                        isLoading={isCurriculumLoading}
                        activeTopicId={activeTopicId}
                        onTopicClick={handleTopicClick}
                        onSubtopicToggle={handleSubtopicToggle}
                        onCategoryToggle={toggleCategory}
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Right Column: Tutor (row 1, col 2) */}
                {user && (
                  <div className="min-h-0 overflow-hidden pl-6 flex flex-col">
                    <MathsTutorInterface ref={tutorRef} inputPortalTarget={chatInputSlot} />
                  </div>
                )}

                {/* Bottom row (row 2): Empty left side */}
                <div className={cn(
                  "flex-shrink-0 py-4",
                  user ? "pr-6" : ""
                )}>
                  {/* Curriculum topics are now pre-populated, no input needed */}
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

export default Index;
