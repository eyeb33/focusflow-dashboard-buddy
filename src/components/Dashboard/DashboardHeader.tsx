
import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <div className="mb-4 sm:mb-6 md:mb-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base font-medium">
        Track your focus sessions, tasks, and productivity insights
      </p>
    </div>
  );
};

export default DashboardHeader;
