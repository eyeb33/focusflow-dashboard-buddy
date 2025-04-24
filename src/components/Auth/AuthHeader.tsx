
import React from 'react';

const AuthHeader = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 justify-center">
        <div className="h-10 w-10 rounded-full bg-pomodoro-work flex items-center justify-center">
          <span className="text-white font-semibold text-lg">T</span>
        </div>
        <span className="text-2xl font-bold">TimeBubble</span>
      </div>
    </div>
  );
};

export default AuthHeader;
