
import React from 'react';
import { DashboardProvider } from '@/contexts/DashboardContext';
import DashboardContainer from '@/components/Dashboard/DashboardContainer';

const Dashboard = () => {
  return (
    <DashboardProvider>
      <DashboardContainer />
    </DashboardProvider>
  );
};

export default Dashboard;
