
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import ChartsGrid from "@/components/Dashboard/ChartsGrid";
import ProductivityInsights from "@/components/Dashboard/ProductivityInsights";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";
import TimeToggle, { TimePeriod } from "@/components/Dashboard/TimeToggle";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import mockDashboardData from '@/data/mockDashboardData'; // add import

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, isLoading: dataLoading, refetch } = useDashboardData();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const visibilityChangedRef = useRef(false);

  // Detect demo mode from query param
  const searchParams = new URLSearchParams(location.search);
  const demoMode = searchParams.get('demo') === '1';

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  // Handle tab visibility with reduced frequency of refreshes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        visibilityChangedRef.current = true;
      } else if (visibilityChangedRef.current) {
        // Only refetch if we're returning to the page after being hidden for more than 30 seconds
        const lastActiveTime = localStorage.getItem('lastActiveTime');
        const now = Date.now();
        if (lastActiveTime && (now - parseInt(lastActiveTime)) > 30000 && !demoMode) {
          refetch();
        }
        visibilityChangedRef.current = false;
        localStorage.setItem('lastActiveTime', now.toString());
      }
    };

    // Set initial active time
    localStorage.setItem('lastActiveTime', Date.now().toString());

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch, demoMode]);

  // Only redirect to auth if not in demo mode
  useEffect(() => {
    if (!demoMode && !authLoading && !user) {
      navigate('/auth', { state: { mode: 'login' } });
    }
  }, [user, authLoading, navigate, demoMode]);

  const isLoading = (!demoMode && (authLoading || dataLoading));

  // Use actual or mock dashboard data (for demo mode)
  const effectiveDashboardData = demoMode ? mockDashboardData : dashboardData;

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

  // Get the correct data based on selected period
  const getPeriodStats = () => {
    const stats = effectiveDashboardData.stats;
    
    // For daily productivity, use chart data directly to ensure consistency
    const deriveDailySessionsAndMinutes = () => {
      const dailyData = effectiveDashboardData.dailyProductivity;
      const totalMinutes = dailyData.reduce((sum, point) => sum + point.minutes, 0);
      const totalSessions = dailyData.reduce((sum, point) => sum + point.sessions, 0);
      const completedCycles = Math.floor(totalSessions / 4);
      return { totalMinutes, totalSessions, completedCycles };
    };
    
    switch (selectedPeriod) {
      case 'today': {
        const { totalMinutes, totalSessions, completedCycles } = deriveDailySessionsAndMinutes();
        return [
          {
            title: "Focus Minutes",
            value: totalMinutes,
            icon: "Flame",
            iconColor: "#ea384c"
          },
          {
            title: "Focus Sessions",
            value: totalSessions,
            icon: "Clock",
            iconColor: "#1EAEDB"
          },
          {
            title: "Completed Cycles",
            value: completedCycles,
            icon: "Cycle",
            iconColor: "#6DD5ED"
          },
        ];
      }
      case 'week':
        return [
          {
            title: "Weekly Focus Minutes",
            value: stats.weeklyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c"
          },
          {
            title: "Weekly Focus Sessions",
            value: stats.weeklyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB"
          },
          {
            title: "Weekly Completed Cycles",
            value: stats.weeklyStats?.completedCycles || 0,
            icon: "Cycle",
            iconColor: "#6DD5ED"
          },
        ];
      case 'month':
        return [
          {
            title: "Monthly Focus Minutes",
            value: stats.monthlyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c"
          },
          {
            title: "Monthly Focus Sessions",
            value: stats.monthlyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB"
          },
          {
            title: "Monthly Completed Cycles",
            value: stats.monthlyStats?.completedCycles || 0,
            icon: "Cycle",
            iconColor: "#6DD5ED"
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader />
        </div>
        <div className="space-y-6">
          <TimeToggle
            selectedPeriod={selectedPeriod}
            onChange={handlePeriodChange}
            className="mx-auto mb-6"
          />
          <StatCardsGrid stats={getPeriodStats()} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartsGrid
                dailyData={effectiveDashboardData.dailyProductivity}
                weeklyData={effectiveDashboardData.weeklyProductivity}
                monthlyData={effectiveDashboardData.monthlyProductivity}
                selectedPeriod={selectedPeriod}
              />
            </div>
            <div className="lg:col-span-1">
              <StreakCalendar
                data={effectiveDashboardData.streakData}
                currentStreak={effectiveDashboardData.stats.currentStreak}
                bestStreak={effectiveDashboardData.stats.bestStreak}
              />
            </div>
          </div>
          <div className="mt-6">
            <ProductivityInsights insights={effectiveDashboardData.insights} />
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
};

export default Dashboard;
