import React from 'react';
import { Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  };
}

const CoachMessage: React.FC<CoachMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex gap-2 items-start",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-muted" : "bg-primary"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Heart className="w-4 h-4 text-primary-foreground" />
        )}
      </div>
      
      <div className={cn(
        "rounded-lg p-3 max-w-[80%]",
        isUser 
          ? "bg-muted text-foreground" 
          : "bg-primary/10 text-foreground"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs opacity-50 mt-1 block">
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};

export default CoachMessage;
