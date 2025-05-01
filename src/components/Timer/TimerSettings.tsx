
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ durations, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(durations || {
    focus: 25,
    break: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4
  });
  
  useEffect(() => {
    // Update local settings when props change
    if (durations) {
      setLocalSettings(durations);
    }
  }, [durations]);
  
  const handleChange = (key: keyof typeof localSettings, value: number) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onChange(updated);
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
                onValueChange={(values) => handleChange(key as keyof typeof localSettings, values[0])}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimerSettings;
