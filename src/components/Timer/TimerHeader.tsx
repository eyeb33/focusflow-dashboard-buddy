
import React from 'react';
import TimerModeTabs from './TimerModeTabs';
import TimerSettings from './TimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';
import { TimerType } from '@/hooks/useTimerSettings';
import { cn } from '@/lib/utils';

interface TimerHeaderProps {
  timerMode: TimerMode;
  handleModeChange: (mode: TimerMode) => void;
  settings: any;
  onSettingsChange: (settings: any) => void;
  onReset?: () => void;
  timerType: TimerType;
  onTimerTypeChange: (type: TimerType) => void;
}

const TimerHeader: React.FC<TimerHeaderProps> = ({ 
  timerMode,
  handleModeChange,
  settings,
  onSettingsChange,
  onReset,
  timerType,
  onTimerTypeChange
}) => {
  const durations = {
    focus: settings?.workDuration || 25,
    break: settings?.breakDuration || 5,
    longBreak: settings?.longBreakDuration || 15,
    sessionsUntilLongBreak: settings?.sessionsUntilLongBreak || 4
  };

  const handleSettingsChange = (newDurations: typeof durations) => {
    // Map the durations back to the settings structure
    const updatedSettings = {
      ...settings,
      workDuration: newDurations.focus,
      breakDuration: newDurations.break,
      longBreakDuration: newDurations.longBreak,
      sessionsUntilLongBreak: newDurations.sessionsUntilLongBreak
    };
    
    onSettingsChange(updatedSettings);
  };
  
  const isFreeStudy = timerType === 'freeStudy';

  return (
    <div className="w-full flex items-center gap-2 mb-4">
      <div className={cn("flex-1", isFreeStudy && "opacity-40 pointer-events-none")}>
        <TimerModeTabs
          currentMode={timerMode}
          onModeChange={handleModeChange}
        />
      </div>
      
      <div className="flex items-center h-full">
        <TimerSettings 
          durations={durations} 
          timerType={timerType}
          onChange={handleSettingsChange}
          onTimerTypeChange={onTimerTypeChange}
          onReset={onReset}
        />
      </div>
    </div>
  );
};

export default TimerHeader;
