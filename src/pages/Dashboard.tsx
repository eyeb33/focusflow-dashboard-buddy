import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import ChartsGrid from "@/components/Dashboard/ChartsGrid";
import ProductivityInsights from "@/components/Dashboard/ProductivityInsights";
import ProductivityTrendChart from "@/components/Dashboard/ProductivityTrendChart";
import UserProfileCard from "@/components/Dashboard/UserProfileCard";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, isLoading: dataLoading, refreshData } = useDashboardData();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { mode: 'login' } });
    }
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || dataLoading;

  const handleRefreshData = async () => {
    try {
      await refreshData();
    } catch (error: any) {
      toast({
        title: "Error refreshing data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pomodoro-work" />
      </div>
    );
  }

  if (!user) {
    return null; // This prevents a flash of content before the redirect
  }

  const stats = [
    {
      title: "Total Sessions",
      value: dashboardData.stats.totalSessions.toString(),
      icon: "Clock",
      iconColor: "#1EAEDB",
      trend: {
        value: dashboardData.stats.weeklyChange.sessions,
        isPositive: dashboardData.stats.weeklyChange.sessions >= 0
      }
    },
    {
      title: "Focus Minutes",
      value: dashboardData.stats.totalMinutes.toString(),
      icon: "Flame",
      iconColor: "#ea384c",
      trend: {
        value: dashboardData.stats.weeklyChange.minutes,
        isPositive: dashboardData.stats.weeklyChange.minutes >= 0
      }
    },
    {
      title: "Daily Average",
      value: dashboardData.stats.dailyAverage.toString(),
      icon: "Target",
      iconColor: "#F97316",
      description: "sessions per day",
      trend: {
        value: dashboardData.stats.weeklyChange.dailyAvg,
        isPositive: dashboardData.stats.weeklyChange.dailyAvg >= 0
      }
    },
    {
      title: "Current Streak",
      value: dashboardData.stats.currentStreak.toString(),
      icon: "Zap",
      iconColor: "#FEF7CD",
      description: "days"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <DashboardHeader />
          <Button 
            onClick={handleRefreshData} 
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>
        
        <UserProfileCard />
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div className="md:col-span-1">
            <StatCardsGrid 
              stats={stats} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ChartsGrid 
              dailyData={dashboardData.dailyProductivity}
              weeklyData={dashboardData.weeklyProductivity}
              monthlyData={dashboardData.monthlyProductivity}
              streakData={dashboardData.streakData}
              currentStreak={dashboardData.stats.currentStreak}
              bestStreak={dashboardData.stats.bestStreak || 0}
            />
          </div>
          <div className="lg:col-span-1">
            <ProductivityInsights insights={dashboardData.insights} />
          </div>
        </div>
        
        <div className="mb-6">
          <ProductivityTrendChart data={dashboardData.productivityTrend} />
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default Dashboard;
