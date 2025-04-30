import React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface TimerSettingsProps {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsPerCycle: number;
  onChange: (newSettings: {
    workDuration: number;
    breakDuration: number;
    longBreakDuration: number;
    sessionsPerCycle: number;
  }) => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  workDuration,
  breakDuration,
  longBreakDuration,
  sessionsPerCycle,
  onChange,
}) => {
  return (
    <div className="space-y-4 p-4">
      <div>
        <Label>Focus Duration: {workDuration} min</Label>
        <Slider
          min={15}
          max={90}
          step={5}
          value={[workDuration]}
          onValueChange={(value) => onChange({ workDuration: value[0], breakDuration, longBreakDuration, sessionsPerCycle })}
        />
      </div>
      <div>
        <Label>Short Break: {breakDuration} min</Label>
        <Slider
          min={1}
          max={30}
          step={1}
          value={[breakDuration]}
          onValueChange={(value) => onChange({ workDuration, breakDuration: value[0], longBreakDuration, sessionsPerCycle })}
        />
      </div>
      <div>
        <Label>Long Break: {longBreakDuration} min</Label>
        <Slider
          min={5}
          max={60}
          step={5}
          value={[longBreakDuration]}
          onValueChange={(value) => onChange({ workDuration, breakDuration, longBreakDuration: value[0], sessionsPerCycle })}
        />
      </div>
      <div>
        <Label>Sessions per Cycle: {sessionsPerCycle}</Label>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[sessionsPerCycle]}
          onValueChange={(value) => onChange({ workDuration, breakDuration, longBreakDuration, sessionsPerCycle: value[0] })}
        />
      </div>
    </div>
  );
};

export default TimerSettings;
