
import React from 'react';

interface SessionInfoProps {
  completedSessions: number;
  totalTimeToday: number;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  completedSessions,
  totalTimeToday
}) => {  
  // Format total time to show hours if needed
  const formatTotalTime = () => {
    if (totalTimeToday >= 60) {
      const hours = Math.floor(totalTimeToday / 60);
      const minutes = totalTimeToday % 60;
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${totalTimeToday}m`;
  };

  return (
    <div className="mt-8 pt-4 border-t grid grid-cols-2 gap-4 text-center">
      <div>
        <div className="text-xl font-bold">{completedSessions}</div>
        <div className="text-xs text-muted-foreground">Focus Sessions</div>
      </div>
      <div>
        <div className="text-xl font-bold">{formatTotalTime()}</div>
        <div className="text-xs text-muted-foreground">Focus Time</div>
      </div>
    </div>
  );
};

export default SessionInfo;
