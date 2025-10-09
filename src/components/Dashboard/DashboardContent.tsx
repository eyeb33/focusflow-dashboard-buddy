import React from 'react';
import { useNavigate } from 'react-router-dom';
import TimeToggle from "@/components/Dashboard/TimeToggle";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import ChartsGrid from "@/components/Dashboard/ChartsGrid";
import TaskTimeCard from "@/components/Dashboard/TaskTimeCard";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";
import { useDashboard } from '@/contexts/DashboardContext';
import { useTasks } from '@/hooks/useTasks';
import { ExperimentalRadialChart } from '@/components/Dashboard/ExperimentalRadialChart';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const DashboardContent = () => {
  const { selectedPeriod, setSelectedPeriod, dashboardData, isDemoMode } = useDashboard();
  const { tasks } = useTasks();
  const navigate = useNavigate();

  const getPeriodStats = () => {
    const stats = dashboardData.stats;
    
    switch (selectedPeriod) {
      case 'today': {
        const dailyData = dashboardData.dailyProductivity;
        const totalMinutes = dailyData.reduce((sum: number, point: any) => sum + point.minutes, 0);
        const totalSessions = dailyData.reduce((sum: number, point: any) => sum + point.sessions, 0);
        const completedCycles = Math.floor(totalSessions / 4);
        
        return [
          {
            title: "Focus Minutes",
            value: totalMinutes,
            icon: "Flame",
            iconColor: "#ea384c",
            trend: stats.dailyStats ? {
              value: stats.dailyStats.minutesTrend,
              isPositive: stats.dailyStats.minutesTrend >= 0
            } : undefined
          },
          {
            title: "Focus Sessions",
            value: totalSessions,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.dailyStats ? {
              value: stats.dailyStats.sessionsTrend,
              isPositive: stats.dailyStats.sessionsTrend >= 0
            } : undefined
          },
          {
            title: "Completed Cycles",
            value: completedCycles,
            icon: "Cycle",
            iconColor: "#6DD5ED",
            trend: stats.weeklyChange ? {
              value: stats.weeklyChange.dailyAvg,
              isPositive: stats.weeklyChange.isPositive
            } : undefined
          },
        ];
      }
      case 'week':
        return [
          {
            title: "Weekly Focus Minutes",
            value: stats.weeklyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c",
            trend: stats.weeklyStats?.minutesTrend ? {
              value: stats.weeklyStats.minutesTrend,
              isPositive: stats.weeklyStats.minutesTrend >= 0
            } : undefined,
            description: stats.weeklyStats?.minutesTrend ? "from last week" : undefined
          },
          {
            title: "Weekly Focus Sessions",
            value: stats.weeklyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.weeklyStats?.sessionsTrend ? {
              value: stats.weeklyStats.sessionsTrend,
              isPositive: stats.weeklyStats.sessionsTrend >= 0
            } : undefined,
            description: stats.weeklyStats?.sessionsTrend ? "from last week" : undefined
          },
          {
            title: "Weekly Completed Cycles",
            value: stats.weeklyStats?.completedCycles || 0,
            icon: "Cycle",
            iconColor: "#6DD5ED",
            trend: stats.weeklyChange ? {
              value: stats.weeklyChange.sessions,
              isPositive: stats.weeklyChange.isPositive
            } : undefined,
            description: stats.weeklyChange?.sessions ? "from last week" : undefined
          },
        ];
      case 'month':
        return [
          {
            title: "Monthly Focus Minutes",
            value: stats.monthlyStats?.totalMinutes || 0,
            icon: "Flame",
            iconColor: "#ea384c",
            trend: stats.monthlyStats?.minutesTrend ? {
              value: stats.monthlyStats.minutesTrend,
              isPositive: stats.monthlyStats.minutesTrend >= 0
            } : undefined,
            description: stats.monthlyStats?.minutesTrend ? "from last month" : undefined
          },
          {
            title: "Monthly Focus Sessions",
            value: stats.monthlyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.monthlyStats?.sessionsTrend ? {
              value: stats.monthlyStats.sessionsTrend,
              isPositive: stats.monthlyStats.sessionsTrend >= 0
            } : undefined,
            description: stats.monthlyStats?.sessionsTrend ? "from last month" : undefined
          },
          {
            title: "Monthly Completed Cycles",
            value: stats.monthlyStats?.completedCycles || 0,
            icon: "Cycle",
            iconColor: "#6DD5ED",
            trend: stats.monthlyChange ? {
              value: stats.monthlyChange.sessions,
              isPositive: stats.monthlyChange.isPositive
            } : undefined,
            description: stats.monthlyChange?.sessions ? "from last month" : undefined
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="bg-muted p-4 rounded-lg border border-muted-foreground/20 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h3 className="font-medium">Demo Dashboard</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            You're viewing demo data. Sign up to track your own productivity and create a personalized dashboard.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-pomodoro-work hover:bg-pomodoro-work/90"
              onClick={() => navigate('/auth', { state: { mode: 'signup' } })}
            >
              Sign Up Now
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate('/auth', { state: { mode: 'login' } })}
            >
              Log In
            </Button>
          </div>
        </div>
      )}
      
      <TimeToggle
        selectedPeriod={selectedPeriod}
        onChange={setSelectedPeriod}
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
        <ExperimentalRadialChart dailyData={dashboardData.dailyProductivity} />
      </div>
      <div className="mt-6">
        <TaskTimeCard tasks={tasks} />
      </div>
    </div>
  );
};

export default DashboardContent;
