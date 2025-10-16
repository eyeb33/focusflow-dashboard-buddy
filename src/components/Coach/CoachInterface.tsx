import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, TrendingUp, Heart, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCoach } from '@/contexts/CoachContext';
import CoachMessage from './CoachMessage';
import WellbeingCheckIn from './WellbeingCheckIn';

const CoachInterface: React.FC = () => {
  const {
    messages,
    isLoading,
    isMinimized,
    unreadCount,
    sendMessage,
    toggleMinimize,
    markAsRead,
    showCheckIn,
    checkInModalOpen,
    setCheckInModalOpen
  } = useCoach();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isMinimized) {
      scrollToBottom();
      markAsRead();
    }
  }, [messages, isMinimized, markAsRead]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue('');
    setShowQuickActions(false);
    await sendMessage(message);
  };

  const handleQuickAction = async (message: string) => {
    setShowQuickActions(false);
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        isMinimized ? "w-14 h-14" : "w-96 h-[600px]"
      )}>
        {isMinimized ? (
          <Button
            onClick={toggleMinimize}
            className="relative w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            size="icon"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        ) : (
          <div className="w-full h-full bg-card border border-border rounded-lg shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-primary/10 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Wellbeing Coach</h3>
                  <p className="text-xs text-muted-foreground">Here to support you</p>
                </div>
              </div>
              <Button
                onClick={toggleMinimize}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm mt-8">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                  <p className="mb-2">Hi! I'm your wellbeing coach.</p>
                  <p>I'm here to help you stay productive and balanced.</p>
                </div>
              )}
              
              {messages.map((message) => (
                <CoachMessage key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex gap-2 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {showQuickActions && messages.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                <Button
                  onClick={() => handleQuickAction("How am I doing today?")}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={isLoading}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Progress
                </Button>
                <Button
                  onClick={() => handleQuickAction("I need some motivation")}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={isLoading}
                >
                  <Heart className="w-3 h-3 mr-1" />
                  Motivation
                </Button>
                <Button
                  onClick={showCheckIn}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={isLoading}
                >
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Check-in
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <WellbeingCheckIn 
        open={checkInModalOpen}
        onOpenChange={setCheckInModalOpen}
      />
    </>
  );
};

export default CoachInterface;
