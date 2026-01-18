
import React from 'react';
import { DashboardProvider } from '@/contexts/DashboardContext';
import DashboardContainer from '@/components/Dashboard/DashboardContainer';
import { Helmet } from 'react-helmet';

const Dashboard = () => {
  return (
    <>
      <Helmet>
        <title>Dashboard - Summit</title>
      </Helmet>
      <DashboardProvider>
        <DashboardContainer />
      </DashboardProvider>
    </>
  );
};

export default Dashboard;
