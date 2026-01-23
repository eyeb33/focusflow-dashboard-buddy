import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  CurriculumTopic, 
  TopicSession, 
  CurriculumCategory,
  TopicWithSession 
} from '@/types/curriculum';
import { CurriculumTopicRow, TopicSessionRow } from '@/types/database';

// Map database row to CurriculumTopic
const mapCurriculumTopic = (row: CurriculumTopicRow): CurriculumTopic => ({
  id: row.id,
  topicId: row.topic_id,
  category: row.category,
  name: row.name,
  subtopics: row.subtopics ?? [],
  sortOrder: row.sort_order ?? 0
});

// Map database row to TopicSession
const mapTopicSession = (row: TopicSessionRow): TopicSession => ({
  id: row.id,
  userId: row.user_id,
  topicId: row.topic_id,
  topicName: row.topic_name,
  totalTimeSeconds: row.total_time_seconds ?? 0,
  lastAccessed: row.last_accessed,
  completedSubtopics: row.completed_subtopics ?? [],
  isActive: row.is_active ?? false,
  messageCount: row.message_count ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const useCurriculumTopics = () => {
  const { user } = useAuth();
  const [curriculumTopics, setCurriculumTopics] = useState<CurriculumTopic[]>([]);
  const [topicSessions, setTopicSessions] = useState<TopicSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Pure Mathematics']) // Only one open by default
  );

  // Fetch curriculum topics
  const fetchCurriculumTopics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('curriculum_topics')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCurriculumTopics((data ?? []).map(mapCurriculumTopic));
    } catch (error) {
      console.error('Error fetching curriculum topics:', error);
      toast.error('Failed to load curriculum');
    }
  }, []);

  // Fetch user's topic sessions
  const fetchTopicSessions = useCallback(async () => {
    if (!user) {
      setTopicSessions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('topic_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false });

      if (error) throw error;
      const sessions = (data ?? []).map(mapTopicSession);
      setTopicSessions(sessions);

      // Find active session
      const activeSess = sessions.find(s => s.isActive);
      if (activeSess) {
        setActiveTopicId(activeSess.topicId);
      }
    } catch (error) {
      console.error('Error fetching topic sessions:', error);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchCurriculumTopics(), fetchTopicSessions()]);
      setIsLoading(false);
    };
    load();
  }, [fetchCurriculumTopics, fetchTopicSessions]);

  // Real-time subscription for topic sessions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('topic-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSession = mapTopicSession(payload.new as TopicSessionRow);
            setTopicSessions(prev => {
              if (prev.some(s => s.id === newSession.id)) return prev;
              return [newSession, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapTopicSession(payload.new as TopicSessionRow);
            setTopicSessions(prev => 
              prev.map(s => s.id === updated.id ? updated : s)
            );
            if (updated.isActive) {
              setActiveTopicId(updated.topicId);
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id?: string })?.id;
            if (deletedId) {
              setTopicSessions(prev => prev.filter(s => s.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Get or create topic session
  const getOrCreateSession = useCallback(async (topicId: string, topicName: string): Promise<TopicSession | null> => {
    if (!user) return null;

    // Check if session exists
    const session = topicSessions.find(s => s.topicId === topicId);
    if (session) return session;

    // Create new session
    try {
      const { data, error } = await supabase
        .from('topic_sessions')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          topic_name: topicName,
          is_active: false,
          last_accessed: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return mapTopicSession(data);
    } catch (error) {
      console.error('Error creating topic session:', error);
      toast.error('Failed to create session');
      return null;
    }
  }, [user, topicSessions]);

  // Set a topic as active (unset others) and auto-expand its category
  const setTopicActive = useCallback(async (topicId: string | null) => {
    if (!user) return;

    // Auto-expand the category containing this topic
    if (topicId) {
      const topic = curriculumTopics.find(t => t.topicId === topicId);
      if (topic) {
        setExpandedCategories(new Set([topic.category]));
      }
    }

    try {
      // First unset all active topics for this user
      await supabase
        .from('topic_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (topicId) {
        // Set the new topic as active
        const { error } = await supabase
          .from('topic_sessions')
          .update({ 
            is_active: true,
            last_accessed: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('topic_id', topicId);

        if (error) throw error;
        setActiveTopicId(topicId);
      } else {
        setActiveTopicId(null);
      }

      // Update local state optimistically
      setTopicSessions(prev => prev.map(s => ({
        ...s,
        isActive: s.topicId === topicId
      })));
    } catch (error) {
      console.error('Error setting active topic:', error);
    }
  }, [user, curriculumTopics]);

  // Update topic session time
  const updateSessionTime = useCallback(async (topicId: string, additionalSeconds: number) => {
    if (!user || additionalSeconds <= 0) return;

    const session = topicSessions.find(s => s.topicId === topicId);
    if (!session) return;

    try {
      const { error } = await supabase
        .from('topic_sessions')
        .update({
          total_time_seconds: session.totalTimeSeconds + additionalSeconds,
          last_accessed: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;

      // Optimistic update
      setTopicSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, totalTimeSeconds: s.totalTimeSeconds + additionalSeconds }
          : s
      ));
    } catch (error) {
      console.error('Error updating session time:', error);
    }
  }, [user, topicSessions]);

  // Toggle subtopic completion
  const toggleSubtopicComplete = useCallback(async (topicId: string, subtopic: string) => {
    if (!user) return;

    const session = topicSessions.find(s => s.topicId === topicId);
    if (!session) return;

    const isCompleted = session.completedSubtopics.includes(subtopic);
    const newCompleted = isCompleted
      ? session.completedSubtopics.filter(st => st !== subtopic)
      : [...session.completedSubtopics, subtopic];

    try {
      const { error } = await supabase
        .from('topic_sessions')
        .update({ completed_subtopics: newCompleted })
        .eq('id', session.id);

      if (error) throw error;

      // Optimistic update
      setTopicSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, completedSubtopics: newCompleted }
          : s
      ));
    } catch (error) {
      console.error('Error toggling subtopic:', error);
    }
  }, [user, topicSessions]);

  // Increment message count
  const incrementMessageCount = useCallback(async (topicId: string) => {
    if (!user) return;

    const session = topicSessions.find(s => s.topicId === topicId);
    if (!session) return;

    try {
      const { error } = await supabase
        .from('topic_sessions')
        .update({ message_count: session.messageCount + 1 })
        .eq('id', session.id);

      if (error) throw error;

      setTopicSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, messageCount: s.messageCount + 1 }
          : s
      ));
    } catch (error) {
      console.error('Error incrementing message count:', error);
    }
  }, [user, topicSessions]);

  // Toggle category expansion (accordion behavior - only one open at a time)
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      // If clicking the already open category, close it
      if (prev.has(category) && prev.size === 1) {
        return new Set();
      }
      // Otherwise, open only the clicked category
      return new Set([category]);
    });
  }, []);

  // Organize topics by category with session data
  const categorizedTopics = useMemo((): CurriculumCategory[] => {
    const categories: Record<string, CurriculumTopic[]> = {};
    
    curriculumTopics.forEach(topic => {
      if (!categories[topic.category]) {
        categories[topic.category] = [];
      }
      categories[topic.category].push(topic);
    });

    // Define order
    const categoryOrder = ['Pure Mathematics', 'Statistics', 'Mechanics'];
    
    return categoryOrder
      .filter(cat => categories[cat])
      .map(cat => ({
        name: cat,
        topics: categories[cat],
        isExpanded: expandedCategories.has(cat)
      }));
  }, [curriculumTopics, expandedCategories]);

  // Get topics with their session data
  const topicsWithSessions = useMemo((): TopicWithSession[] => {
    return curriculumTopics.map(topic => {
      const session = topicSessions.find(s => s.topicId === topic.topicId);
      const completedCount = session?.completedSubtopics.length ?? 0;
      const totalSubtopics = topic.subtopics.length;
      const progressPercent = totalSubtopics > 0 
        ? Math.round((completedCount / totalSubtopics) * 100)
        : 0;

      return {
        topic,
        session: session ?? null,
        progressPercent,
        isActive: activeTopicId === topic.topicId
      };
    });
  }, [curriculumTopics, topicSessions, activeTopicId]);

  // Category progress stats
  const categoryProgress = useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};
    
    categorizedTopics.forEach(cat => {
      const total = cat.topics.length;
      const completed = cat.topics.filter(t => {
        const session = topicSessions.find(s => s.topicId === t.topicId);
        if (!session) return false;
        return session.completedSubtopics.length >= t.subtopics.length && t.subtopics.length > 0;
      }).length;
      
      stats[cat.name] = { completed, total };
    });
    
    return stats;
  }, [categorizedTopics, topicSessions]);

  // Get the active session
  const activeSession = useMemo(() => {
    return topicSessions.find(s => s.isActive) ?? null;
  }, [topicSessions]);

  return {
    curriculumTopics,
    topicSessions,
    isLoading,
    activeTopicId,
    activeSession,
    categorizedTopics,
    topicsWithSessions,
    categoryProgress,
    expandedCategories,
    toggleCategory,
    getOrCreateSession,
    setTopicActive,
    updateSessionTime,
    toggleSubtopicComplete,
    incrementMessageCount,
    refetch: async () => {
      await Promise.all([fetchCurriculumTopics(), fetchTopicSessions()]);
    }
  };
};
