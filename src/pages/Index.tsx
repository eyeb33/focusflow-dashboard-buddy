import React, { useCallback, useState, useEffect, useRef } from 'react';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import { useAuth } from '@/contexts/AuthContext';
import TimerContainer from "@/components/Timer/TimerContainer";
import HeroAuthCard from "@/components/Auth/HeroAuthCard";
import { useTimerContext } from '@/contexts/TimerContext';
import MathsTutorInterface, { MathsTutorInterfaceRef } from '@/components/Tutor/MathsTutorInterface';
import CurriculumTopicList from '@/components/Curriculum/CurriculumTopicList';
import { useCurriculumTopics } from '@/hooks/useCurriculumTopics';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { List, GraduationCap } from 'lucide-react';

type ContentView = 'topics' | 'tutor';

const Index = () => {
  const { user } = useAuth();
  const { setActiveTaskId, getElapsedMinutes, getElapsedSeconds, isRunning, handleStart, activeTaskId } = useTimerContext();

  const tutorRef = useRef<MathsTutorInterfaceRef>(null);

  const [linkedTaskIds, setLinkedTaskIds] = useState<Set<string>>(new Set());
  const [contentView, setContentView] = useState<ContentView>('topics');

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
    
    // 5. Switch to tutor view
    setContentView('tutor');
    
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

  // Get active topic info for the tutor
  const activeTopicInfo = activeSession ? {
    id: activeSession.topicId,
    name: activeSession.topicName,
    totalTimeSeconds: activeSession.totalTimeSeconds,
    completedSubtopics: activeSession.completedSubtopics || []
  } : null;

  // Different layout containers for authenticated vs unauthenticated
  if (!user) {
    // Unauthenticated: keep the page within the viewport (no document scroll),
    // and allow scrolling only if content actually exceeds the viewport.
    return (
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <HeroAuthCard />
        </main>
        <MobileNav />
      </div>
    );
  }

  // Authenticated: fixed viewport layout with internal scrolling
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      <main className="flex-1 min-h-0 w-full py-4 px-3 md:px-4 lg:px-[3vw]">
        <div className="h-full grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 md:gap-4 lg:gap-[2vw] xl:gap-[3vw]">
          
          {/* Column 1: Timer (centered, fixed size with proper overflow handling) */}
          <div className="flex flex-col items-center justify-center bg-card rounded-xl border border-border/50 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80 dark:border-border/30 dark:hover:border-border/50 w-full md:w-[320px] lg:w-[360px] min-w-0 overflow-hidden">
            <TimerContainer activeTask={activeTask} />
          </div>

          {/* Column 2: Toggleable Content (Topics List OR Tutor) */}
          <div className="flex flex-col min-h-0 overflow-hidden bg-card rounded-xl border border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border/80 dark:border-border/30 dark:hover:border-border/50">
            
            {/* View Toggle Header */}
            <div className="flex-shrink-0 border-b border-border bg-muted/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={contentView === 'topics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setContentView('topics')}
                  className="gap-2"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Topics</span>
                </Button>
                <Button
                  variant={contentView === 'tutor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setContentView('tutor')}
                  className="gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Tutor</span>
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {contentView === 'topics' ? (
                <div className="h-full flex flex-col p-4">
                  <div className="pb-3 flex-shrink-0">
                    <h2 className="text-lg font-display font-semibold tracking-tight">A-Level Maths Curriculum</h2>
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
              ) : (
                <div className="h-full flex flex-col">
                  <MathsTutorInterface 
                    ref={tutorRef} 
                    inputPortalTarget={chatInputSlot}
                    activeTopic={activeTopicInfo}
                    onSwitchToTopics={() => setContentView('topics')}
                  />
                  <div ref={setChatInputSlot} className="flex-shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default Index;
