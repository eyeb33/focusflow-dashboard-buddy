
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TimeToggle, { TimePeriod } from "@/components/Dashboard/TimeToggle";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { mockDashboardData } from '@/data/mockDashboardData';
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardContent from "@/components/Dashboard/DashboardContent";
import { usePeriodStats } from "@/hooks/usePeriodStats";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, isLoading: dataLoading, refetch } = useDashboardData();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const visibilityChangedRef = useRef(false);

  const searchParams = new URLSearchParams(location.search);
  const demoMode = searchParams.get('demo') === '1';

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityChangedRef.current = true;
      } else if (visibilityChangedRef.current) {
        const lastActiveTime = localStorage.getItem('lastActiveTime');
        const now = Date.now();
        if (lastActiveTime && (now - parseInt(lastActiveTime)) > 30000 && !demoMode) {
          refetch();
        }
        visibilityChangedRef.current = false;
        localStorage.setItem('lastActiveTime', now.toString());
      }
    };
    localStorage.setItem('lastActiveTime', Date.now().toString());
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch, demoMode]);

  useEffect(() => {
    if (!demoMode && !authLoading && !user) {
      navigate('/auth', { state: { mode: 'login' } });
    }
  }, [user, authLoading, navigate, demoMode]);

  const isLoading = (!demoMode && (authLoading || dataLoading));
  
  // Create a properly formatted dashboard data object whether we're using demo or real data
  const effectiveDashboardData = demoMode ? mockDashboardData : {
    ...dashboardData,
    // Map trends to productivityTrend for consistency with mockDashboardData
    productivityTrend: dashboardData.trends || []
  };

  const statsCards = usePeriodStats({
    dashboardData: effectiveDashboardData,
    selectedPeriod,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pomodoro-work" />
      </div>
    );
  }

  if (!demoMode && !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <TimeToggle
        selectedPeriod={selectedPeriod}
        onChange={handlePeriodChange}
        className="mx-auto mb-6"
      />
      <StatCardsGrid stats={statsCards} />
      <DashboardContent dashboardData={effectiveDashboardData} selectedPeriod={selectedPeriod} />
    </DashboardLayout>
  );
};

export default Dashboard;
