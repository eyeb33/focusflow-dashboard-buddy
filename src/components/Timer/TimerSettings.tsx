"use client";

import React from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useTimerSettings } from "@/hooks/useTimerSettings";
import { cn } from "@/lib/utils";

interface TimerSettingsProps {
  className?: string;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ className }) => {
  const { settings, updateSettings } = useTimerSettings();

  const handleChange = (key: keyof typeof settings, value: number) => {
    updateSettings({ ...settings, [key]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "p-2 rounded-full hover:bg-muted transition-all",
            className
          )}
          aria-label="Open Settings"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 space-y-4" align="end">
        <h4 className="text-sm font-medium">Timer Settings</h4>
        <div className="space-y-3">
          {[
            { key: "workDuration", label: "Focus Duration (min)" },
            { key: "breakDuration", label: "Break Duration (min)" },
            { key: "longBreakDuration", label: "Long Break Duration (min)" },
            { key: "sessionsBeforeLongBreak", label: "Sessions before Long Break" },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label>{label}</Label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[settings[key as keyof typeof settings]]}
                  min={key === "sessionsBeforeLongBreak" ? 1 : 5}
                  max={key === "sessionsBeforeLongBreak" ? 10 : 60}
                  step={key === "sessionsBeforeLongBreak" ? 1 : 5}
                  onValueChange={(val) =>
                    handleChange(key as keyof typeof settings, val[0])
                  }
                />
                <Input
                  className="w-12 px-2 py-1 text-center text-sm"
                  type="number"
                  value={settings[key as keyof typeof settings]}
                  onChange={(e) =>
                    handleChange(
                      key as keyof typeof settings,
                      Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TimerSettings;
