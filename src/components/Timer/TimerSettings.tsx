
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTimer } from "@/contexts/TimerContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface TimerSettingsProps {
  className?: string;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ className }) => {
  const {
    settings,
    updateSettings,
    timerMode,
    handleReset
  } = useTimer();
  
  const { toast } = useToast();

  const { 
    workDuration, 
    breakDuration, 
    longBreakDuration, 
    sessionsUntilLongBreak 
  } = settings;

  const handleSettingsUpdate = (settingsUpdate: Partial<typeof settings>) => {
    // Apply the settings update
    updateSettings(settingsUpdate);
    
    // Reset the timer when settings change to apply the new duration
    setTimeout(() => {
      // Only reset if we're in the related mode to avoid unexpected resets
      if ((settingsUpdate.workDuration && timerMode === 'work') || 
          (settingsUpdate.breakDuration && timerMode === 'break') ||
          (settingsUpdate.longBreakDuration && timerMode === 'longBreak')) {
        handleReset();
      }
    }, 50);
    
    // Show a toast confirmation
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
              <span className="text-sm text-muted-foreground">{workDuration} min</span>
            </div>
            <Slider
              id="work-duration"
              min={5}
              max={60}
              step={5}
              value={[workDuration]}
              onValueChange={(value) => handleSettingsUpdate({ workDuration: value[0] })}
              className="[&_[role=slider]]:bg-red-500 [&_.SliderRange]:bg-red-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="break-duration">Break Duration</Label>
              <span className="text-sm text-muted-foreground">{breakDuration} min</span>
            </div>
            <Slider
              id="break-duration"
              min={1}
              max={15}
              step={1}
              value={[breakDuration]}
              onValueChange={(value) => handleSettingsUpdate({ breakDuration: value[0] })}
              className="[&_[role=slider]]:bg-green-500 [&_.SliderRange]:bg-green-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="long-break-duration">Long Break Duration</Label>
              <span className="text-sm text-muted-foreground">{longBreakDuration} min</span>
            </div>
            <Slider
              id="long-break-duration"
              min={10}
              max={30}
              step={5}
              value={[longBreakDuration]}
              onValueChange={(value) => handleSettingsUpdate({ longBreakDuration: value[0] })}
              className="[&_[role=slider]]:bg-blue-500 [&_.SliderRange]:bg-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="sessions-until-long-break">Sessions Until Long Break</Label>
              <span className="text-sm text-muted-foreground">{sessionsUntilLongBreak}</span>
            </div>
            <Slider
              id="sessions-until-long-break"
              min={1}
              max={8}
              step={1}
              value={[sessionsUntilLongBreak]}
              onValueChange={(value) => handleSettingsUpdate({ sessionsUntilLongBreak: value[0] })}
              className="[&_[role=slider]]:bg-primary [&_.SliderRange]:bg-primary"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimerSettings;
