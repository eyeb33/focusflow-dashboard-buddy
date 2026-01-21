import React, { useCallback, useState, useEffect, useRef } from 'react';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import TimerContainer from "@/components/Timer/TimerContainer";
import AuthPrompt from "@/components/Auth/AuthPrompt";
import { useTimerContext } from '@/contexts/TimerContext';
import MathsTutorInterface, { MathsTutorInterfaceRef } from '@/components/Tutor/MathsTutorInterface';
import CurriculumTopicList from '@/components/Curriculum/CurriculumTopicList';
import { useCurriculumTopics } from '@/hooks/useCurriculumTopics';
import { Task } from '@/types/task';


const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveTaskId, getElapsedMinutes, getElapsedSeconds, isRunning, handleStart, activeTaskId } = useTimerContext();

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

    // 2. Open the chat session with the topic (pass isTopicId=true for curriculum topics)
    tutorRef.current?.openTaskSession(topicId, topicName, true);
    
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
      
      {user ? (
        /* Authenticated: 3-column responsive layout with internal scrolling */
        <main className="flex-1 min-h-0 w-full py-4 px-[3vw]">
          <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[3vw]">
            
            {/* Column 1: Timer (centered, fixed size) */}
            <div className="flex flex-col items-center lg:items-stretch bg-card rounded-xl border border-border/50 p-4 shadow-sm">
              <div className="flex-shrink-0">
                <TimerContainer activeTask={activeTask} />
              </div>
            </div>

            {/* Column 2: Curriculum Topics List */}
            <div className="flex flex-col min-h-0 overflow-hidden bg-card rounded-xl border border-border/50 p-4 shadow-sm">
              <div className="pb-3 flex-shrink-0">
                <h2 className="text-lg font-display font-semibold tracking-tight">Task List: A-Level Maths Curriculum</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Edexcel Specification</p>
              </div>
              
              <div className="flex-1 min-h-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none" />
                
                <div className="h-full overflow-y-auto">
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
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
              </div>
            </div>

            {/* Column 3: AI Tutor Chat */}
            <div className="min-h-0 flex flex-col overflow-hidden bg-card rounded-xl border border-border/50 p-4 shadow-sm">
              <MathsTutorInterface ref={tutorRef} inputPortalTarget={chatInputSlot} />
              <div ref={setChatInputSlot} className="flex-shrink-0" />
            </div>
          </div>
        </main>
      ) : (
        /* Non-authenticated: Timer centered with onboarding prompt below */
        <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 overflow-auto">
          <div className="flex-shrink-0">
            <TimerContainer activeTask={null} />
          </div>
          
          <AuthPrompt onSignupClick={handleSignupClick} />
        </main>
      )}
      
      <MobileNav />
    </div>
  );
};

export default Index;
