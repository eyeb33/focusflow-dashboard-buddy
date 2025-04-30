// src/components/Timer/TimerContainer.tsx

import React from "react";
import PomodoroTimer from "./PomodoroTimer";

const TimerContainer = () => {
  return (
    <div className="w-full flex justify-center items-center">
      <PomodoroTimer />
    </div>
  );
};

export default TimerContainer;
