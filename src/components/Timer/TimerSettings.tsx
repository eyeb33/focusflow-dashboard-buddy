
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TimerSettingsProps {
  durations: {
    focus: number;
    break: number;
    longBreak: number;
    sessionsUntilLongBreak: number;
  };
  onChange: (durations: {
    focus: number;
    break: number;
    longBreak: number;
    sessionsUntilLongBreak: number;
  }) => void;
  onReset?: () => void; // Add optional reset handler
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ durations, onChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(durations || {
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });
  
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
  
  const settingsConfig = [
    { label: 'Focus Duration (min)', key: 'focus', min: 1, max: 60 },
    { label: 'Break Duration (min)', key: 'break', min: 1, max: 15 },
    { label: 'Long Break Duration (min)', key: 'longBreak', min: 5, max: 30 },
    { label: 'Focus Sessions Until Long Break', key: 'sessionsUntilLongBreak', min: 1, max: 10 }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings size={18} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle>Timer Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
              />
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Timer Sequence:</p>
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">Focus</span>
            <span className="text-gray-500">→</span>
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Break</span>
            <span className="text-gray-500">→</span>
            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">Focus</span>
            <span className="text-gray-500">→</span>
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Break</span>
            <span className="text-gray-500">→</span>
            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">Focus</span>
            <span className="text-gray-500">→</span>
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Break</span>
            <span className="text-gray-500">→</span>
            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">Focus</span>
            <span className="text-gray-500">→</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Long Break</span>
          </div>
          <p className="text-xs mt-2 text-muted-foreground">The timer automatically advances through the sequence. After a long break, you'll need to manually start the next focus session.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimerSettings;
