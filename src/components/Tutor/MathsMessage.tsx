import React, { useMemo } from 'react';
import { GraduationCap, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'katex/dist/katex.min.css';
import katex from 'katex';
interface MathsMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  };
}

// Parse and render LaTeX in content
const renderMathContent = (content: string): string => {
  // Handle display math ($$...$$)
  let result = content.replace(/\$\$(.*?)\$\$/gs, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false
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
        strict: false
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
        strict: false
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
        strict: false
      });
    } catch (e) {
      return `\\(${math}\\)`;
    }
  });
  return result;
};
const MathsMessage: React.FC<MathsMessageProps> = ({
  message
}) => {
  const isUser = message.role === 'user';
  const renderedContent = useMemo(() => {
    return renderMathContent(message.content);
  }, [message.content]);
  return <div className={cn("flex gap-3 items-start", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm", isUser ? "bg-muted" : "bg-primary")}>
        {isUser ? <User className="w-5 h-5 text-muted-foreground" /> : <GraduationCap className="w-5 h-5 text-primary-foreground" />}
      </div>
      
      <div className={cn("rounded-xl px-4 py-3 max-w-[85%] shadow-sm", isUser ? "bg-muted text-foreground" : "bg-primary/10 text-foreground")}>
        <div className="text-sm whitespace-pre-wrap leading-relaxed maths-content text-gray-900" dangerouslySetInnerHTML={{
        __html: renderedContent
      }} />
        <span className="text-xs opacity-50 mt-2 block">
          {new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
        </span>
      </div>
    </div>;
};
export default MathsMessage;