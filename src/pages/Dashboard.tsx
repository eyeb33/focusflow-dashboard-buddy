
import React, { useState } from 'react';
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
import { Loader2, RefreshCw, Clock, Flame, Target, Zap } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, isLoading: dataLoading, refreshData } = useDashboardData();
  const { toast } = useToast();
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

  const getPeriodStats = () => {
    const stats = dashboardData.stats;
    
    switch (selectedPeriod) {
      case 'today':
        return [
          {
            title: "Total Sessions",
            value: stats.totalSessions,
            icon: "Clock",
            iconColor: "#1EAEDB"
          },
          {
            title: "Focus Minutes",
            value: stats.totalMinutes,
            icon: "Flame",
            iconColor: "#ea384c"
          }
        ];
      case 'week':
        return [
          {
            title: "Weekly Sessions",
            value: stats.weeklyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB"
          },
          {
            title: "Weekly Focus",
            value: stats.weeklyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c"
          }
        ];
      case 'month':
        return [
          {
            title: "Monthly Sessions",
            value: stats.monthlyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB"
          },
          {
            title: "Monthly Focus",
            value: stats.monthlyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c"
          }
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
          <Button 
            onClick={refreshData} 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Time Period Toggle */}
          <TimeToggle 
            selectedPeriod={selectedPeriod}
            onChange={handlePeriodChange}
            className="mx-auto mb-6"
          />
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCardsGrid stats={getPeriodStats()} />
          </div>

          {/* Charts and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartsGrid 
                dailyData={dashboardData.dailyProductivity}
                weeklyData={dashboardData.weeklyProductivity}
                monthlyData={dashboardData.monthlyProductivity}
                streakData={dashboardData.streakData}
                currentStreak={dashboardData.stats.currentStreak}
                bestStreak={dashboardData.stats.bestStreak}
                selectedPeriod={selectedPeriod}
              />
            </div>
            <div className="lg:col-span-1">
              <ProductivityInsights insights={dashboardData.insights} />
            </div>
          </div>

          {/* Streak Calendar */}
          <div className="mt-6">
            <StreakCalendar 
              data={dashboardData.streakData}
              currentStreak={dashboardData.stats.currentStreak}
              bestStreak={dashboardData.stats.bestStreak}
            />
          </div>
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default Dashboard;
