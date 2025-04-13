
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import SessionCounter from "@/components/Dashboard/SessionCounter";
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, RefreshCw } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fetchTodayStats, fetchYesterdayStats } from '@/utils/timerStorage';

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { dashboardData, isLoading: dataLoading, refreshData } = useDashboardData();
  const [todayStats, setTodayStats] = React.useState({ completedSessions: 0, totalTimeToday: 0 });
  const [yesterdayStats, setYesterdayStats] = React.useState({ completedSessions: 0 });
  const [isLoadingToday, setIsLoadingToday] = React.useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { mode: 'login' } });
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    if (user) {
      const getStats = async () => {
        setIsLoadingToday(true);
        try {
          console.log('Fetching today\'s and yesterday\'s stats');
          const today = await fetchTodayStats(user.id);
          const yesterday = await fetchYesterdayStats(user.id);
          
          console.log('Today\'s stats:', today);
          console.log('Yesterday\'s stats:', yesterday);
          
          setTodayStats(today);
          setYesterdayStats(yesterday);
        } catch (error) {
          console.error("Error fetching stats:", error);
        } finally {
          setIsLoadingToday(false);
        }
      };
      
      getStats();
    }
  }, [user]);

  const isLoading = authLoading || dataLoading || isLoadingToday;

  const handleRefreshData = async () => {
    try {
      setIsLoadingToday(true);
      console.log('Refreshing dashboard data');
      
      await refreshData();
      
      if (user) {
        console.log('Refreshing today\'s and yesterday\'s stats');
        const today = await fetchTodayStats(user.id);
        const yesterday = await fetchYesterdayStats(user.id);
        
        console.log('Refreshed today\'s stats:', today);
        console.log('Refreshed yesterday\'s stats:', yesterday);
        
        setTodayStats(today);
        setYesterdayStats(yesterday);
      }
      
      toast({
        title: "Data refreshed",
        description: "The latest session data has been loaded.",
      });
    } catch (error: any) {
      toast({
        title: "Error refreshing data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingToday(false);
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
      title: "Total Focus Sessions",
      value: dashboardData.stats.totalSessions.toString(),
      icon: "Clock",
      iconColor: "#1EAEDB",
      description: "all time",
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
      title: "Current Streak",
      value: `${dashboardData.stats.currentStreak} days`,
      icon: "Zap",
      iconColor: "#F59E0B",
      trend: {
        value: 0, // Streaks don't have a weekly change percentage
        isPositive: true
      }
    },
    {
      title: "Daily Average",
      value: dashboardData.stats.dailyAverage.toString(),
      icon: "Target",
      iconColor: "#F97316",
      description: "minutes per day",
      trend: {
        value: dashboardData.stats.weeklyChange.dailyAvg,
        isPositive: dashboardData.stats.weeklyChange.dailyAvg >= 0
      }
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
        
        <SessionCounter 
          todaySessions={todayStats.completedSessions} 
          yesterdaySessions={yesterdayStats.completedSessions}
          onRefresh={handleRefreshData}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <div className="md:col-span-1">
            <StatCardsGrid 
              stats={stats} 
            />
          </div>
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
};

export default Dashboard;
