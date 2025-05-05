
import React, { useEffect } from 'react';
import TimerModeTabs from './TimerModeTabs';
import TimerSettings from './TimerSettings';
import { TimerMode } from '@/utils/timerContextUtils';

interface TimerHeaderProps {
  timerMode: TimerMode;
  handleModeChange: (mode: TimerMode) => void;
  settings: {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  } | undefined;
  onSettingsChange: (newDurations: any) => void;
}

const TimerHeader: React.FC<TimerHeaderProps> = ({
  timerMode,
  handleModeChange,
  settings,
  onSettingsChange,
}) => {
  // Map timer context settings to the format expected by TimerSettings
  const timerSettingsDurations = {
    focus: settings?.workDuration || 25,
    break: settings?.breakDuration || 5,
    longBreak: settings?.longBreakDuration || 15,
    sessionsUntilLongBreak: settings?.sessionsUntilLongBreak || 4
  };
  
  // Debug settings mapping
  useEffect(() => {
    console.log("TimerHeader settings mapping:", {
      contextSettings: settings,
      uiSettings: timerSettingsDurations
    });
  }, [settings]);
  
  // Handle settings changes from TimerSettings component
  const handleSettingsChange = (newDurations: any) => {
    console.log("TimerHeader received settings change:", newDurations);
    // Map back to the format expected by the timer context
    const mappedSettings = {
      workDuration: newDurations.focus,
      breakDuration: newDurations.break,
      longBreakDuration: newDurations.longBreak,
      sessionsUntilLongBreak: newDurations.sessionsUntilLongBreak
    };
    // Pass settings up to parent
    onSettingsChange(mappedSettings);
  };

  return (
    <div className="flex items-center justify-between w-full mb-2">
      <TimerModeTabs 
        currentMode={timerMode === 'work' ? 'focus' : timerMode} 
        onModeChange={(newMode) => {
          // Convert focus back to work for compatibility
          const mappedMode = newMode === 'focus' ? 'work' : newMode;
          handleModeChange(mappedMode);
        }} 
      />
      
      <TimerSettings 
        durations={timerSettingsDurations}
        onChange={handleSettingsChange}
      />
    </div>
  );
};

export default TimerHeader;
