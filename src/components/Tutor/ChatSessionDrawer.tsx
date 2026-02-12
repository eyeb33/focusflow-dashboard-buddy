import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { History, MessageSquare, Trash2, Pencil, Check, X, BookOpen, PenTool, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  title: string;
  persona: string;
  exam_board: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  linked_topic_id?: string | null;
  linked_subtopic?: string | null;
}

interface ChatSessionDrawerProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateTitle: (sessionId: string, newTitle: string) => void;
  isLoading?: boolean;
}

// Group sessions by topic for a cleaner view
interface TopicGroup {
  topicId: string | null;
  topicName: string;
  sessions: ChatSession[];
  latestAt: string;
}

const ChatSessionDrawer: React.FC<ChatSessionDrawerProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onUpdateTitle,
  isLoading = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Group sessions by topic
  const groupedSessions = useMemo(() => {
    const groups: Map<string, TopicGroup> = new Map();
    
    for (const session of sessions) {
      const key = session.linked_topic_id || 'standalone';
      
      if (!groups.has(key)) {
        groups.set(key, {
          topicId: session.linked_topic_id || null,
          topicName: session.linked_topic_id ? session.title.split(' → ')[0] : 'General Chats',
          sessions: [],
          latestAt: session.last_message_at,
        });
      }
      
      const group = groups.get(key)!;
      group.sessions.push(session);
      
      // Update latest timestamp
      if (new Date(session.last_message_at) > new Date(group.latestAt)) {
        group.latestAt = session.last_message_at;
      }
    }
    
    // Sort groups by latest activity, topics first
    return Array.from(groups.values()).sort((a, b) => {
      // Topics before standalone
      if (a.topicId && !b.topicId) return -1;
      if (!a.topicId && b.topicId) return 1;
      // Then by latest activity
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    });
  }, [sessions]);

  const toggleTopic = (topicKey: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicKey)) {
        next.delete(topicKey);
      } else {
        next.add(topicKey);
      }
      return next;
    });
  };

  const handleStartEdit = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditValue(session.title);
  };

  const handleSaveEdit = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (editValue.trim()) {
      onUpdateTitle(sessionId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      if (editValue.trim()) {
        onUpdateTitle(sessionId, editValue.trim());
      }
      setEditingId(null);
      setEditValue('');
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setEditingId(null);
      setEditValue('');
    }
  };

  const getModeIcon = (persona: string) => {
    switch (persona) {
      case 'practice':
        return <PenTool className="w-3 h-3" />;
      case 'explain':
      default:
        return <BookOpen className="w-3 h-3" />;
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Chat history">
          <History className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Chat History
          </DrawerTitle>
          <DrawerDescription>
            Select a previous session to continue or review past conversations
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="flex-1 px-4 max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No previous sessions</p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {groupedSessions.map((group) => {
                const key = group.topicId || 'standalone';
                const isExpanded = expandedTopics.has(key);
                const hasMultipleSessions = group.sessions.length > 1;
                const isCurrentGroup = group.sessions.some(s => s.id === currentSessionId);
                
                // For single sessions or standalone, show directly
                if (!hasMultipleSessions || !group.topicId) {
                  return group.sessions.map((session) => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      currentSessionId={currentSessionId}
                      editingId={editingId}
                      editValue={editValue}
                      onSelectSession={onSelectSession}
                      onStartEdit={handleStartEdit}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDeleteSession={onDeleteSession}
                      setEditValue={setEditValue}
                      getModeIcon={getModeIcon}
                    />
                  ));
                }
                
                // For topics with multiple sessions, show collapsible group
                return (
                  <div key={key} className="space-y-1">
                    {/* Topic Header */}
                    <button
                      onClick={() => toggleTopic(key)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/50",
                        isCurrentGroup && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{group.topicName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({group.sessions.length} sessions)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Show mode icons for available modes */}
                        {Array.from(new Set(group.sessions.map(s => s.persona))).map(mode => (
                          <span key={mode} className="text-muted-foreground">
                            {getModeIcon(mode)}
                          </span>
                        ))}
                      </div>
                    </button>
                    
                    {/* Expanded Sessions */}
                    {isExpanded && (
                      <div className="pl-6 space-y-1">
                        {group.sessions.map((session) => (
                          <SessionRow
                            key={session.id}
                            session={session}
                            currentSessionId={currentSessionId}
                            editingId={editingId}
                            editValue={editValue}
                            onSelectSession={onSelectSession}
                            onStartEdit={handleStartEdit}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onDeleteSession={onDeleteSession}
                            setEditValue={setEditValue}
                            getModeIcon={getModeIcon}
                            compact
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

// Extracted session row component
interface SessionRowProps {
  session: ChatSession;
  currentSessionId: string | null;
  editingId: string | null;
  editValue: string;
  onSelectSession: (sessionId: string) => void;
  onStartEdit: (e: React.MouseEvent, session: ChatSession) => void;
  onSaveEdit: (e: React.MouseEvent, sessionId: string) => void;
  onCancelEdit: (e: React.MouseEvent) => void;
  onDeleteSession: (sessionId: string) => void;
  setEditValue: (value: string) => void;
  getModeIcon: (persona: string) => React.ReactNode;
  compact?: boolean;
}

const SessionRow: React.FC<SessionRowProps> = ({
  session,
  currentSessionId,
  editingId,
  editValue,
  onSelectSession,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteSession,
  setEditValue,
  getModeIcon,
  compact = false,
}) => {
  const isEditing = editingId === session.id;
  const isCurrent = currentSessionId === session.id;
  
  // Format title for display
  const displayTitle = session.linked_subtopic 
    ? `${session.linked_subtopic} (${session.persona})`
    : session.title;
  
  return (
    <DrawerClose asChild>
      <div
        className={cn(
          "flex items-center justify-between rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
          compact ? "p-2" : "p-3",
          isCurrent && "bg-primary/10 border-primary"
        )}
        onClick={() => !isEditing && onSelectSession(session.id)}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {/* Mode Icon */}
          <span className="text-muted-foreground flex-shrink-0">
            {getModeIcon(session.persona)}
          </span>
          
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => handleKeyDown(e, session.id)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-success hover:text-success hover:bg-success/10"
                onClick={(e) => onSaveEdit(e, session.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onCancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium truncate", compact ? "text-xs" : "text-sm")}>
                {displayTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(session.last_message_at), compact ? 'MMM d' : 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={(e) => onStartEdit(e, session)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </DrawerClose>
  );
};

export default ChatSessionDrawer;