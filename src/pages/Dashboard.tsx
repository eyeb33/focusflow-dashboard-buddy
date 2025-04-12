
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
import { Loader2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, isLoading: dataLoading } = useDashboardData();
  const navigate = useNavigate();

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
    return null; // This prevents a flash of content before the redirect
  }

  // Create stats for the StatCardsGrid
  const stats = [
    {
      title: "Total Sessions",
      value: dashboardData.stats.totalSessions.toString(),
      icon: "Clock",
      trend: {
        value: 12,
        isPositive: true
      }
    },
    {
      title: "Focus Minutes",
      value: dashboardData.stats.totalMinutes.toString(),
      icon: "Flame"
    },
    {
      title: "Daily Average",
      value: dashboardData.stats.dailyAverage.toString(),
      icon: "Target",
      description: "sessions per day"
    },
    {
      title: "Current Streak",
      value: dashboardData.stats.currentStreak.toString(),
      icon: "Zap",
      description: "days"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <DashboardHeader />
        
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
