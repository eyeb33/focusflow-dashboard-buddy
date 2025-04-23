
import React, { createContext, useContext } from 'react';
import { TimePeriod } from '@/components/Dashboard/TimeToggle';
import { useDashboardData } from '@/hooks/useDashboardData';

interface DashboardContextType {
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
  dashboardData: any;
  isLoading: boolean;
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('today');
  const { dashboardData, isLoading, refetch } = useDashboardData();

  return (
    <DashboardContext.Provider
      value={{
        selectedPeriod,
        setSelectedPeriod,
        dashboardData,
        isLoading,
        refetch,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
