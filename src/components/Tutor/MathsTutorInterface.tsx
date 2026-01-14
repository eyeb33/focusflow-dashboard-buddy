import React, { useEffect, useRef, useState } from 'react';
import { Send, GraduationCap, BookOpen, PenTool, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCoach } from '@/contexts/CoachContext';
import MathsMessage from './MathsMessage';
import { CoachActionFeedback } from '../Coach/CoachActionFeedback';

const MathsTutorInterface: React.FC = () => {
  const {
    messages,
    isLoading,
    currentAction,
    mode,
    setMode,
    sendMessage,
    markAsRead
  } = useCoach();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    markAsRead();
  }, [messages, markAsRead]);

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
    <div className="w-full h-full flex flex-col bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-primary/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg">A-Level Maths Tutor</h3>
              <p className="text-sm text-muted-foreground">AQA Specification • Here to guide you</p>
            </div>
          </div>
        </div>
        
        {/* Mode Selection */}
        <div className="flex gap-2">
          <Button
            onClick={() => setMode('explain')}
            variant={mode === 'explain' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Explain
          </Button>
          <Button
            onClick={() => setMode('practice')}
            variant={mode === 'practice' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <PenTool className="w-4 h-4 mr-2" />
            Practice
          </Button>
          <Button
            onClick={() => setMode('check')}
            variant={mode === 'check' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Check
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-8 px-4">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary/50" />
            <h4 className="text-lg font-semibold mb-2">Welcome to your A-Level Maths Tutor!</h4>
            <p className="mb-4">I'm here to help you master the AQA A-Level Maths curriculum.</p>
            <div className="text-sm text-left bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
              <p className="font-medium mb-2">I can help you with:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Pure Mathematics (Algebra, Calculus, Trigonometry)</li>
                <li>Statistics & Probability</li>
                <li>Mechanics</li>
                <li>Problem-solving techniques</li>
              </ul>
              <p className="mt-3 text-xs italic">I'll guide you through problems step-by-step, helping you learn rather than just giving answers.</p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <MathsMessage key={message.id} message={message} />
        ))}

        {currentAction && (
          <CoachActionFeedback action={currentAction} />
        )}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3 max-w-[85%]">
              <div className="flex gap-1.5">
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
      {showQuickActions && messages.length === 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          <Button
            onClick={() => handleQuickAction("I need help solving a quadratic equation")}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={isLoading}
          >
            Quadratics
          </Button>
          <Button
            onClick={() => handleQuickAction("Can you explain differentiation step by step?")}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={isLoading}
          >
            Differentiation
          </Button>
          <Button
            onClick={() => handleQuickAction("I'm struggling with integration by parts")}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={isLoading}
          >
            Integration
          </Button>
          <Button
            onClick={() => handleQuickAction("Give me a practice problem on trigonometry")}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={isLoading}
          >
            Trigonometry
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-background/50">
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question or paste a problem..."
            disabled={isLoading}
            className="flex-1 h-12 text-base"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-12 w-12"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Tip: Use $ for inline maths like $x^2$ and $$ for display equations
        </p>
      </div>
    </div>
  );
};

export default MathsTutorInterface;
