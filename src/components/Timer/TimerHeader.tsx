
import React from 'react';
import TimerModeTabs from './TimerModeTabs';
import TimerSettings from './TimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerHeaderProps {
  timerMode: TimerMode;
  handleModeChange: (mode: TimerMode) => void;
  settings: any;
  onSettingsChange: (settings: any) => void;
  onReset?: () => void; // Add optional reset handler
}

const TimerHeader: React.FC<TimerHeaderProps> = ({ 
  timerMode,
  handleModeChange,
  settings,
  onSettingsChange,
  onReset
}) => {
  const durations = {
    focus: settings?.workDuration || 25,
    break: settings?.breakDuration || 5,
    longBreak: settings?.longBreakDuration || 15,
    sessionsUntilLongBreak: settings?.sessionsUntilLongBreak || 4
  };

  return (
    <div className="w-full flex flex-col md:flex-row justify-between items-center mb-4">
      <div className="w-full mb-2 md:mb-0 md:flex-1">
        <TimerModeTabs
          currentMode={timerMode}
          onModeChange={handleModeChange}
        />
      </div>
      
      <div className="ml-auto">
        <TimerSettings 
          durations={durations} 
          onChange={onSettingsChange} 
          onReset={onReset} // Pass reset handler to TimerSettings
        />
      </div>
    </div>
  );
};

export default TimerHeader;
