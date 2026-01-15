import React from 'react';
import { format } from 'date-fns';
import { History, MessageSquare, Trash2 } from 'lucide-react';
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
}

interface ChatSessionDrawerProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading?: boolean;
}

const ChatSessionDrawer: React.FC<ChatSessionDrawerProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  isLoading = false,
}) => {
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
              {sessions.map((session) => (
                <DrawerClose asChild key={session.id}>
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                      currentSessionId === session.id && "bg-primary/10 border-primary"
                    )}
                    onClick={() => onSelectSession(session.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.last_message_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </DrawerClose>
              ))}
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

export default ChatSessionDrawer;
