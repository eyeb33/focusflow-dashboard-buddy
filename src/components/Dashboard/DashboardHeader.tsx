
import React from 'react';

const DashboardHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-display font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-2 text-base font-medium">
        Track your focus sessions, tasks, and productivity insights
      </p>
    </div>
  );
};

export default DashboardHeader;
