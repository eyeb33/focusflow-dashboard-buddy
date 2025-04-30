// TimerSettings.tsx
import React from 'react';

const TimerSettings = ({ settings, onChange }: any) => {
  return (
    <div className="bg-gray-900 text-white p-4 rounded space-y-4">
      {[
        { label: 'Focus Duration (min)', key: 'focus', min: 5, max: 60 },
        { label: 'Break Duration (min)', key: 'break', min: 1, max: 15 },
        { label: 'Long Break Duration (min)', key: 'longBreak', min: 5, max: 30 },
        { label: 'Sessions before Long Break', key: 'sessionsBeforeLongBreak', min: 1, max: 10 }
      ].map(({ label, key, min, max }) => (
        <div key={key}>
          <label className="block text-sm mb-1">{label}</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={min}
              max={max}
              value={Math.floor(settings[key] / 60) || settings[key]}
              onChange={(e) =>
                onChange(key, key.includes('Duration') ? parseInt(e.target.value) * 60 : parseInt(e.target.value))
              }
              className="w-full"
            />
            <span className="w-10 text-right">
              {key.includes('Duration')
                ? Math.floor(settings[key] / 60)
                : settings[key]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimerSettings;
