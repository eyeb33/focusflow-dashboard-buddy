
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
import { useTimerSettings } from "@/hooks/useTimerSettings";

const TimerSettings: React.FC = () => {
  const {
    settings,
    updateWorkDuration,
    updateBreakDuration,
    updateLongBreakDuration,
    updateSessionsUntilLongBreak
  } = useTimerSettings();

  const { 
    workDuration, 
    breakDuration, 
    longBreakDuration, 
    sessionsUntilLongBreak 
  } = settings;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
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
              onValueChange={(value) => updateWorkDuration(value[0])}
              className="[&_[role=slider]]:bg-pomodoro-work"
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
              onValueChange={(value) => updateBreakDuration(value[0])}
              className="[&_[role=slider]]:bg-green-400"
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
              onValueChange={(value) => updateLongBreakDuration(value[0])}
              className="[&_[role=slider]]:bg-pomodoro-longBreak"
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
              onValueChange={(value) => updateSessionsUntilLongBreak(value[0])}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimerSettings;
