
import React from 'react';

interface SessionInfoProps {
  completedSessions: number;
  totalTimeToday: number;
  sessionsUntilLongBreak: number;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  completedSessions,
  totalTimeToday,
  sessionsUntilLongBreak
}) => {
  return (
    <div className="mt-8 pt-4 border-t grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-xl font-bold">{completedSessions}</div>
        <div className="text-xs text-muted-foreground">Sessions</div>
      </div>
      <div>
        <div className="text-xl font-bold">{totalTimeToday}</div>
        <div className="text-xs text-muted-foreground">Minutes</div>
      </div>
      <div>
        <div className="text-xl font-bold">
          {Math.floor(completedSessions / sessionsUntilLongBreak)}
        </div>
        <div className="text-xs text-muted-foreground">Rounds</div>
      </div>
    </div>
  );
};

export default SessionInfo;
