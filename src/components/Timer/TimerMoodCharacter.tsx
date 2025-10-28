import React from 'react';
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/Theme/ThemeProvider";

interface TimerMoodCharacterProps {
  mode: 'focus' | 'break' | 'longBreak';
  isRunning: boolean;
  progress: number; // 0-100
}

const TimerMoodCharacter: React.FC<TimerMoodCharacterProps> = ({ 
  mode, 
  isRunning,
  progress 
}) => {
  const { theme } = useTheme();
  
  // Determine character mood based on mode and progress
  const getMoodState = () => {
    if (!isRunning) return 'idle';
    
    if (mode === 'focus') {
      if (progress < 30) return 'energetic';
      if (progress < 70) return 'focused';
      return 'tired';
    }
    
    if (mode === 'break' || mode === 'longBreak') {
      if (progress < 50) return 'relaxed';
      return 'refreshed';
    }
    
    return 'idle';
  };

  const moodState = getMoodState();
  
  // Character colors based on mode
  const getCharacterColor = () => {
    if (theme === 'dark') {
      switch (mode) {
        case 'break': return '#2fc55e';
        case 'longBreak': return '#3b81f6';
        default: return '#ff4545';
      }
    }
    
    switch (mode) {
      case 'break': return '#4ECDC4';
      case 'longBreak': return '#45B7D1';
      default: return '#FF6B58';
    }
  };

  // Eyes based on mood
  const getEyes = () => {
    const eyeColor = theme === 'dark' ? '#ffffff' : '#000000';
    const pupilColor = theme === 'dark' ? '#000000' : '#ffffff';
    
    switch (moodState) {
      case 'focused':
        return (
          <>
            {/* Concentrated eyes */}
            <ellipse cx="35" cy="45" rx="8" ry="12" fill={eyeColor} />
            <ellipse cx="65" cy="45" rx="8" ry="12" fill={eyeColor} />
            <circle cx="35" cy="47" r="4" fill={pupilColor} />
            <circle cx="65" cy="47" r="4" fill={pupilColor} />
          </>
        );
      case 'tired':
        return (
          <>
            {/* Half-closed eyes */}
            <line x1="27" y1="45" x2="43" y2="45" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
            <line x1="57" y1="45" x2="73" y2="45" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          </>
        );
      case 'energetic':
        return (
          <>
            {/* Wide open eyes */}
            <circle cx="35" cy="45" r="10" fill={eyeColor} />
            <circle cx="65" cy="45" r="10" fill={eyeColor} />
            <circle cx="35" cy="45" r="5" fill={pupilColor} />
            <circle cx="65" cy="45" r="5" fill={pupilColor} />
          </>
        );
      case 'relaxed':
        return (
          <>
            {/* Closed happy eyes */}
            <path d="M 27 45 Q 35 50 43 45" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 57 45 Q 65 50 73 45" stroke={eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'refreshed':
        return (
          <>
            {/* Sparkly eyes */}
            <circle cx="35" cy="45" r="9" fill={eyeColor} />
            <circle cx="65" cy="45" r="9" fill={eyeColor} />
            <circle cx="35" cy="45" r="4" fill={pupilColor} />
            <circle cx="65" cy="45" r="4" fill={pupilColor} />
            <circle cx="32" cy="42" r="2" fill={pupilColor} opacity="0.7" />
            <circle cx="62" cy="42" r="2" fill={pupilColor} opacity="0.7" />
          </>
        );
      default:
        return (
          <>
            {/* Neutral eyes */}
            <circle cx="35" cy="45" r="8" fill={eyeColor} />
            <circle cx="65" cy="45" r="8" fill={eyeColor} />
            <circle cx="35" cy="45" r="4" fill={pupilColor} />
            <circle cx="65" cy="45" r="4" fill={pupilColor} />
          </>
        );
    }
  };

  // Mouth based on mood
  const getMouth = () => {
    const mouthColor = theme === 'dark' ? '#ffffff' : '#000000';
    
    switch (moodState) {
      case 'focused':
        return <line x1="40" y1="70" x2="60" y2="70" stroke={mouthColor} strokeWidth="3" strokeLinecap="round" />;
      case 'tired':
        return <path d="M 40 73 Q 50 70 60 73" stroke={mouthColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'energetic':
      case 'refreshed':
        return <path d="M 35 65 Q 50 75 65 65" stroke={mouthColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'relaxed':
        return <path d="M 40 68 Q 50 73 60 68" stroke={mouthColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
      default:
        return <path d="M 40 70 Q 50 73 60 70" stroke={mouthColor} strokeWidth="3" fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <div className={cn(
      "absolute top-8 transition-all duration-500",
      isRunning && "animate-bounce-gentle"
    )}>
      <svg 
        width="100" 
        height="100" 
        viewBox="0 0 100 100"
        className="drop-shadow-lg"
      >
        {/* Character body - blob shape */}
        <ellipse 
          cx="50" 
          cy="60" 
          rx="40" 
          ry="35" 
          fill={getCharacterColor()}
          className="transition-all duration-500"
        />
        
        {/* Ears/bumps on top */}
        <circle cx="30" cy="30" r="15" fill={getCharacterColor()} />
        <circle cx="70" cy="30" r="15" fill={getCharacterColor()} />
        
        {/* Face features */}
        <g className="transition-all duration-300">
          {getEyes()}
          {getMouth()}
        </g>
      </svg>
    </div>
  );
};

export default TimerMoodCharacter;
