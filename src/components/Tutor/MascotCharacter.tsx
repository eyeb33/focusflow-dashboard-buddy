import React from 'react';
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/Theme/ThemeProvider";
import { MascotState } from '@/types/mascotSystem';

interface MascotCharacterProps {
  state: MascotState;
  message?: string;
  className?: string;
}

const MascotCharacter: React.FC<MascotCharacterProps> = ({ 
  state,
  message,
  className
}) => {
  const { theme } = useTheme();
  
  // Simple buddy color - matches syllabuddy logo
  const getBuddyColor = () => {
    if (theme === 'dark') {
      switch (state) {
        case 'celebrating': return '#fbbf24'; // gold glow
        case 'excited': return '#60a5fa'; // bright blue
        case 'encouraging': return '#34d399'; // green
        case 'thinking': return '#a78bfa'; // purple
        case 'confused': return '#fb923c'; // orange
        default: return '#3b82f6'; // default blue
      }
    }
    
    switch (state) {
      case 'celebrating': return '#f59e0b'; // gold
      case 'excited': return '#3b82f6'; // bright blue
      case 'encouraging': return '#10b981'; // green
      case 'thinking': return '#8b5cf6'; // purple
      case 'confused': return '#f97316'; // orange
      default: return '#2563eb'; // default blue
    }
  };

  // Eyes based on state - simple and expressive like the logo
  const getEyes = () => {
    const eyeColor = theme === 'dark' ? '#1e293b' : '#ffffff';
    
    switch (state) {
      case 'celebrating':
        return (
          <>
            {/* Star eyes */}
            <g transform="translate(50, 42)">
              <path d="M0,-12 L3,-5 L12,-5 L5,2 L8,12 L0,6 L-8,12 L-5,2 L-12,-5 L-3,-5 Z" fill={eyeColor} />
            </g>
            <g transform="translate(114, 42)">
              <path d="M0,-12 L3,-5 L12,-5 L5,2 L8,12 L0,6 L-8,12 L-5,2 L-12,-5 L-3,-5 Z" fill={eyeColor} />
            </g>
          </>
        );
      case 'excited':
        return (
          <>
            {/* Wide happy eyes - vertical rounded rectangles */}
            <rect x="38" y="20" width="24" height="45" rx="12" fill={eyeColor} />
            <rect x="102" y="20" width="24" height="45" rx="12" fill={eyeColor} />
          </>
        );
      case 'thinking':
        return (
          <>
            {/* Eyes looking up - vertical rounded rectangles */}
            <rect x="40" y="15" width="20" height="42" rx="10" fill={eyeColor} />
            <rect x="104" y="15" width="20" height="42" rx="10" fill={eyeColor} />
          </>
        );
      case 'confused':
        return (
          <>
            {/* Asymmetric eyes - one normal, one tilted */}
            <rect x="40" y="22" width="20" height="42" rx="10" fill={eyeColor} />
            <rect x="104" y="22" width="20" height="42" rx="10" fill={eyeColor} transform="rotate(15 114 43)" />
          </>
        );
      case 'encouraging':
        return (
          <>
            {/* Warm friendly eyes - slightly wider vertical rounded rectangles */}
            <rect x="36" y="20" width="26" height="46" rx="13" fill={eyeColor} />
            <rect x="102" y="20" width="26" height="46" rx="13" fill={eyeColor} />
          </>
        );
      default: // idle
        return (
          <>
            {/* Normal relaxed eyes - vertical rounded rectangles */}
            <rect x="40" y="22" width="20" height="42" rx="10" fill={eyeColor} />
            <rect x="104" y="22" width="20" height="42" rx="10" fill={eyeColor} />
          </>
        );
    }
  };

  return (
    <div className={cn("relative", className)}>
      <svg 
        width="128" 
        height="64" 
        viewBox="0 -16 164 100"
        className="drop-shadow-lg"
      >
        {/* Simple rounded rectangle buddy body - like syllabuddy logo, 2x wider */}
        <rect 
          x="4" 
          y="4" 
          width="156" 
          height="76" 
          rx="24"
          fill={getBuddyColor()}
          className={cn(
            "transition-all duration-500",
            state === 'celebrating' && "animate-bounce",
            state === 'excited' && "animate-pulse"
          )}
        />
        
        {/* Antennae - classic robot style */}
        <g className={state === 'thinking' ? 'antenna-pulse' : ''}>
          {/* Left antenna */}
          <line 
            x1="40" 
            y1="4" 
            x2="28" 
            y2="-8" 
            stroke={getBuddyColor()} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle 
            cx="28" 
            cy="-8" 
            r="3" 
            fill={getBuddyColor()} 
            opacity="0.9"
          />
          
          {/* Right antenna */}
          <line 
            x1="124" 
            y1="4" 
            x2="136" 
            y2="-8" 
            stroke={getBuddyColor()} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle 
            cx="136" 
            cy="-8" 
            r="3" 
            fill={getBuddyColor()} 
            opacity="0.9"
          />
        </g>
        
        {/* Eyes - the only expression element */}
        {getEyes()}
      </svg>
      
      {/* Speech bubble with message */}
      {message && (
        <div className={cn(
          "absolute right-full mr-3 top-1/2 -translate-y-1/2",
          "bg-primary/10 border border-primary/20 rounded-lg px-3 py-2",
          "max-w-[250px] animate-in fade-in slide-in-from-right-2",
          "shadow-md backdrop-blur-sm"
        )}>
          {/* Speech bubble tail */}
          <div className="absolute left-full top-1/2 -translate-y-1/2">
            <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-primary/20" />
            <div className="absolute top-0 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-primary/10 -translate-x-[1px]" />
          </div>
          
          <p className="text-sm font-medium text-primary">
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

export default MascotCharacter;
