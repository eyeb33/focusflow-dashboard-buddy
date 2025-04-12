
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
import { mockDashboardData } from "@/data/mockDashboardData";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { state: { mode: 'login' } });
    }
  }, [user, isLoading, navigate]);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <DashboardHeader />
        
        <UserProfileCard />
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div className="md:col-span-1">
            <StatCardsGrid 
              stats={mockDashboardData.stats} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ChartsGrid 
              dailyData={mockDashboardData.dailyProductivity}
              weeklyData={mockDashboardData.weeklyProductivity}
              monthlyData={mockDashboardData.monthlyProductivity}
              streakData={mockDashboardData.streakData}
            />
          </div>
          <div className="lg:col-span-1">
            <ProductivityInsights insights={mockDashboardData.insights} />
          </div>
        </div>
        
        <div className="mb-6">
          <ProductivityTrendChart data={mockDashboardData.productivityTrend} />
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default Dashboard;
