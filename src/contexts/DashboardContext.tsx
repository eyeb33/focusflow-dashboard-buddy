import React, { createContext, useContext } from 'react';
import { TimePeriod } from '@/components/Dashboard/TimeToggle';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { mockDashboardData } from '@/data/mockDashboardData';
import { DashboardData } from '@/hooks/dashboard/types';

interface DashboardContextType {
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
  dashboardData: DashboardData;
  isLoading: boolean;
  refetch: () => void;
  isDemoMode: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('today');
  const { user } = useAuth();
  const { dashboardData: userData, isLoading, refetch } = useDashboardData();
  
  // Use mock data for non-authenticated users (demo mode)
  const isDemoMode = !user;
  const dashboardData = isDemoMode ? mockDashboardData : userData;

  return (
    <DashboardContext.Provider
      value={{
        selectedPeriod,
        setSelectedPeriod,
        dashboardData,
        isLoading,
        refetch,
        isDemoMode
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
