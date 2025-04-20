
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import StatsDisplay from "../StatsDisplay";
import { useSessionStats } from "../useSessionStats";

const SessionInfo: React.FC = () => {
  const { stats, isLoading } = useSessionStats();
  
  // Calculate percentage changes
  const sessionsDiff = stats.yesterdayFocusSessions !== null && stats.yesterdayFocusSessions > 0
    ? Math.round(((stats.focusSessions - stats.yesterdayFocusSessions) / stats.yesterdayFocusSessions) * 100)
    : null;
  
  const minutesDiff = stats.yesterdayFocusMinutes !== null && stats.yesterdayFocusMinutes > 0
    ? Math.round(((stats.focusMinutes - stats.yesterdayFocusMinutes) / stats.yesterdayFocusMinutes) * 100)
    : null;

  return (
    <Card className="mt-4 bg-white/50 dark:bg-black/30">
      <CardContent className="p-4">
        <div className="flex justify-between">
          <StatsDisplay 
            label="Focus Sessions"
            value={stats.focusSessions}
            diff={sessionsDiff}
            isLoading={isLoading}
            positiveColor="text-green-600"
            negativeColor="text-red-600"
          />
          
          <StatsDisplay 
            label="Focus Minutes"
            value={stats.focusMinutes}
            diff={minutesDiff}
            isLoading={isLoading}
            positiveColor="text-green-600"
            negativeColor="text-red-600"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionInfo;
