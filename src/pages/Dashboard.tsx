
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, isLoading: dataLoading } = useDashboardData();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { mode: 'login' } });
    }
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pomodoro-work" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get the correct data based on selected period
  const getPeriodStats = () => {
    const stats = dashboardData.stats;
    
    // For daily productivity, derive sessions based on productivity data
    const deriveDailySessionsAndMinutes = () => {
      // Use chart data to calculate total values
      const dailyData = dashboardData.dailyProductivity;
      const totalMinutes = dailyData.reduce((sum, point) => sum + point.minutes, 0);
      const totalSessions = dailyData.reduce((sum, point) => sum + point.sessions, 0);
      
      // Calculate cycles based on sessions and the standard 4 sessions per cycle
      const completedCycles = Math.floor(totalSessions / 4);
      
      return { totalMinutes, totalSessions, completedCycles };
    };
    
    switch (selectedPeriod) {
      case 'today': {
        // Use the derived data from chart for today instead of the stats object
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
                dailyData={dashboardData.dailyProductivity}
                weeklyData={dashboardData.weeklyProductivity}
                monthlyData={dashboardData.monthlyProductivity}
                selectedPeriod={selectedPeriod}
              />
            </div>
            <div className="lg:col-span-1">
              <StreakCalendar
                data={dashboardData.streakData}
                currentStreak={dashboardData.stats.currentStreak}
                bestStreak={dashboardData.stats.bestStreak}
              />
            </div>
          </div>
          <div className="mt-6">
            <ProductivityInsights insights={dashboardData.insights} />
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
};

export default Dashboard;
