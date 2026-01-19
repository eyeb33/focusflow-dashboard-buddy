
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TimerType } from '@/hooks/useTimerSettings';

interface TimerSettingsProps {
  durations: {
    focus: number;
    break: number;
    longBreak: number;
    sessionsUntilLongBreak: number;
  };
  timerType: TimerType;
  onChange: (durations: {
    focus: number;
    break: number;
    longBreak: number;
    sessionsUntilLongBreak: number;
  }) => void;
  onTimerTypeChange: (type: TimerType) => void;
  onReset?: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ durations, timerType, onChange, onTimerTypeChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(durations || {
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });
  
  const isFreeStudy = timerType === 'freeStudy';
  
  // Update local settings when props change (without triggering onChange)
  useEffect(() => {
    if (durations) {
      setLocalSettings(durations);
    }
  }, [durations]);
  
  const handleChange = (key: keyof typeof localSettings, value: number) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    
    // Call onChange immediately with the updated value
    onChange(updated);
    
    // Call reset handler if provided to simulate Reset button behavior
    if (onReset) {
      onReset();
    }
  };
  
  const handleTimerTypeToggle = (type: TimerType) => {
    onTimerTypeChange(type);
    if (onReset) {
      onReset();
    }
  };
  
  const settingsConfig = [
    { label: 'Focus Duration (min)', key: 'focus', min: 1, max: 60 },
    { label: 'Break Duration (min)', key: 'break', min: 1, max: 15 },
    { label: 'Long Break Duration (min)', key: 'longBreak', min: 1, max: 30 },
    { label: 'Focus Sessions Until Long Break', key: 'sessionsUntilLongBreak', min: 1, max: 10 }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
          <Clock size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>
        
        {/* Timer Type Toggle */}
        <div className="flex justify-center py-3">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => handleTimerTypeToggle('pomodoro')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                timerType === 'pomodoro'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pomodoro
            </button>
            <button
              onClick={() => handleTimerTypeToggle('freeStudy')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
                timerType === 'freeStudy'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Free Study
            </button>
          </div>
        </div>
        
        <div className={cn("space-y-4 py-2 transition-opacity", isFreeStudy && "opacity-40 pointer-events-none")}>
          {settingsConfig.map(({ label, key, min, max }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={key}>{label}</Label>
                <span className="text-sm text-muted-foreground">
                  {localSettings[key as keyof typeof localSettings]}
                </span>
              </div>
              <Slider
                id={key}
                min={min}
                max={max}
                step={1}
                value={[localSettings[key as keyof typeof localSettings]]}
                onValueChange={(values) => {
                  if (values && values.length > 0) {
                    handleChange(key as keyof typeof localSettings, values[0]);
                  }
                }}
                className="cursor-pointer"
                disabled={isFreeStudy}
              />
            </div>
          ))}
        </div>
        
        <div className={cn("pt-4 border-t transition-opacity", isFreeStudy && "opacity-40")}>
          {isFreeStudy ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Free Study Mode</p>
              <p className="text-xs text-muted-foreground">Timer counts up from 0:00. Time is tracked to your active study topic.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">Timer Sequence:</p>
              <div className="flex justify-center items-center gap-2 mb-3">
                {Array.from({ length: localSettings.sessionsUntilLongBreak }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: "#ff4545" }}
                      title="Focus"
                    />
                    {i < localSettings.sessionsUntilLongBreak - 1 && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: "#2fc55e" }}
                        title="Break"
                      />
                    )}
                  </div>
                ))}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: "#3b81f6" }}
                  title="Long Break"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">The timer automatically advances through the sequence. After a long break, you'll need to manually start the next focus session.</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimerSettings;
