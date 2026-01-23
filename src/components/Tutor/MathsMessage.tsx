import React, { useMemo, useState } from 'react';
import { User, BookOpen, PenTool, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import DOMPurify from 'dompurify';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export type TutorMode = 'explain' | 'practice' | 'check';

export interface RAGSource {
  id: string;
  topic?: string;
  page_number?: number;
  document_title?: string;
  content_preview: string;
  similarity: number;
}

interface MathsMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
    sources?: RAGSource[];
  };
  mode?: TutorMode;
}

// Configure DOMPurify for KaTeX output
const createSanitizer = () => {
  // Allow KaTeX-specific tags and attributes
  return (html: string) => DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'span', 'div', 'br', 'p', 'strong', 'em', 'sup', 'sub',
      'math', 'annotation', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'mroot', 'msqrt',
      'svg', 'line', 'path', 'rect', 'g'
    ],
    ALLOWED_ATTR: ['class', 'style', 'aria-hidden', 'xmlns', 'd', 'viewBox', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'fill', 'stroke', 'stroke-width'],
    ALLOW_DATA_ATTR: false,
  });
};

const sanitize = createSanitizer();

// Parse and render LaTeX in content with sanitization
const renderMathContent = (content: string): string => {
  // Handle display math ($$...$$)
  let result = content.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: 'warn'
      });
    } catch (e) {
      return `$$${math}$$`;
    }
  });

  // Handle inline math ($...$) but not escaped \$
  result = result.replace(/(?<!\\)\$([^$]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: 'warn'
      });
    } catch (e) {
      return `$${math}$`;
    }
  });

  // Handle \[ ... \] display math
  result = result.replace(/\\\[(.*?)\\\]/gs, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: 'warn'
      });
    } catch (e) {
      return `\\[${math}\\]`;
    }
  });

  // Handle \( ... \) inline math
  result = result.replace(/\\\((.*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: 'warn'
      });
    } catch (e) {
      return `\\(${math}\\)`;
    }
  });
  
  // Sanitize the final HTML to prevent XSS
  return sanitize(result);
};

const SourcesDisplay: React.FC<{ sources: RAGSource[] }> = ({ sources }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3 pt-3 border-t border-primary/20">
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-auto p-1 gap-1.5 text-xs text-primary/70 hover:text-primary hover:bg-primary/5"
        >
          <BookOpen className="h-3 w-3" />
          <span>Based on {sources.length} curriculum source{sources.length > 1 ? 's' : ''}</span>
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {sources.map((source, index) => (
          <div 
            key={source.id} 
            className="p-2 bg-background/50 rounded-lg border border-primary/10 text-xs"
          >
            <div className="flex items-center gap-2 mb-1">
              {source.topic && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                  {source.topic}
                </Badge>
              )}
              {source.page_number && (
                <span className="text-muted-foreground">p.{source.page_number}</span>
              )}
              <span className="text-muted-foreground ml-auto">
                {source.similarity}% match
              </span>
            </div>
            {source.document_title && (
              <p className="text-[10px] text-muted-foreground mb-1 truncate">
                From: {source.document_title}
              </p>
            )}
            <p className="text-muted-foreground leading-relaxed">
              {source.content_preview}
            </p>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Get the appropriate icon for the tutor mode
const getModeIcon = (mode: TutorMode) => {
  switch (mode) {
    case 'practice':
      return <PenTool className="w-5 h-5 text-primary-foreground" />;
    case 'check':
      return <CheckCircle className="w-5 h-5 text-primary-foreground" />;
    case 'explain':
    default:
      return <BookOpen className="w-5 h-5 text-primary-foreground" />;
  }
};

const MathsMessage: React.FC<MathsMessageProps> = ({
  message,
  mode = 'explain'
}) => {
  const isUser = message.role === 'user';
  const renderedContent = useMemo(() => {
    return renderMathContent(message.content);
  }, [message.content]);

  return (
    <div className={cn("flex gap-3 items-start", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
        isUser ? "bg-muted" : "bg-primary"
      )}>
        {isUser ? (
          <User className="w-5 h-5 text-muted-foreground" />
        ) : (
          getModeIcon(mode)
        )}
      </div>
      
      <div className={cn(
        "rounded-xl px-4 py-3 max-w-[85%] shadow-sm",
        isUser ? "bg-muted text-foreground" : "bg-primary/10 text-foreground"
      )}>
        <div 
          className="text-sm whitespace-pre-wrap leading-relaxed maths-content text-foreground" 
          dangerouslySetInnerHTML={{ __html: renderedContent }} 
        />
        
        {/* Show sources for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <SourcesDisplay sources={message.sources} />
        )}
        
        <span className="text-xs opacity-50 mt-2 block">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};

export default MathsMessage;
