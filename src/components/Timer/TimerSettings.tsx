
import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTimerSettings } from "@/hooks/useTimerSettings";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { TimerSettings as TimerSettingsType } from "@/hooks/useTimerSettings";

interface TimerSettingsProps {
  className?: string;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ className }) => {
  const { settings, updateSettings, resetSettings } = useTimerSettings();
  const { toast } = useToast();
  
  // Create local state to track settings before save
  const [localSettings, setLocalSettings] = useState<TimerSettingsType>(settings);
  
  // Update local settings when main settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Update local settings without immediately applying them
  const updateLocalSettings = (settingsUpdate: Partial<TimerSettingsType>) => {
    setLocalSettings(prev => ({
      ...prev,
      ...settingsUpdate
    }));
  };

  // Function to save all settings and show toast notification
  const saveAllSettings = () => {
    console.log("Saving settings:", localSettings);
    
    // Apply all local settings at once
    updateSettings(localSettings);
    
    toast({
      title: "Settings updated",
      description: "Your timer settings have been saved",
      duration: 2000,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("rounded-full h-8 w-8 p-0", className)}>
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Timer Settings</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="work-duration">Work Duration</Label>
              <span className="text-sm text-muted-foreground">{localSettings.workDuration} min</span>
            </div>
            <Slider
              id="work-duration"
              min={5}
              max={60}
              step={5}
              value={[localSettings.workDuration]}
              onValueChange={(value) => updateLocalSettings({ workDuration: value[0] })}
              className="[&_[role=slider]]:bg-red-500 [&_.SliderRange]:bg-red-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="break-duration">Break Duration</Label>
              <span className="text-sm text-muted-foreground">{localSettings.breakDuration} min</span>
            </div>
            <Slider
              id="break-duration"
              min={1}
              max={15}
              step={1}
              value={[localSettings.breakDuration]}
              onValueChange={(value) => updateLocalSettings({ breakDuration: value[0] })}
              className="[&_[role=slider]]:bg-green-500 [&_.SliderRange]:bg-green-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="long-break-duration">Long Break Duration</Label>
              <span className="text-sm text-muted-foreground">{localSettings.longBreakDuration} min</span>
            </div>
            <Slider
              id="long-break-duration"
              min={10}
              max={30}
              step={5}
              value={[localSettings.longBreakDuration]}
              onValueChange={(value) => updateLocalSettings({ longBreakDuration: value[0] })}
              className="[&_[role=slider]]:bg-blue-500 [&_.SliderRange]:bg-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sessions-until-long-break">Sessions Until Long Break</Label>
              <span className="text-sm text-muted-foreground">{localSettings.sessionsUntilLongBreak}</span>
            </div>
            <Slider
              id="sessions-until-long-break"
              min={1}
              max={8}
              step={1}
              value={[localSettings.sessionsUntilLongBreak]}
              onValueChange={(value) => updateLocalSettings({ sessionsUntilLongBreak: value[0] })}
              className="[&_[role=slider]]:bg-primary [&_.SliderRange]:bg-primary"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="flex-1" 
              onClick={saveAllSettings}
            >
              Save Settings
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={resetSettings}
            >
              Reset Defaults
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimerSettings;
