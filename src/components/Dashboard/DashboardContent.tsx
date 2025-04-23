import React from 'react';
import TimeToggle from "@/components/Dashboard/TimeToggle";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import ChartsGrid from "@/components/Dashboard/ChartsGrid";
import ProductivityInsights from "@/components/Dashboard/ProductivityInsights";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";
import { useDashboard } from '@/contexts/DashboardContext';

const DashboardContent = () => {
  const { selectedPeriod, setSelectedPeriod, dashboardData } = useDashboard();

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
            iconColor: "#ea384c",
            trend: stats.weeklyStats?.minutesTrend ? {
              value: stats.weeklyStats.minutesTrend,
              isPositive: stats.weeklyStats.minutesTrend >= 0
            } : undefined
          },
          {
            title: "Weekly Focus Sessions",
            value: stats.weeklyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.weeklyStats?.sessionsTrend ? {
              value: stats.weeklyStats.sessionsTrend,
              isPositive: stats.weeklyStats.sessionsTrend >= 0
            } : undefined
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
            iconColor: "#ea384c",
            trend: stats.monthlyStats?.minutesTrend ? {
              value: stats.monthlyStats.minutesTrend,
              isPositive: stats.monthlyStats.minutesTrend >= 0
            } : undefined
          },
          {
            title: "Monthly Focus Sessions",
            value: stats.monthlyStats?.totalSessions || 0,
            icon: "Clock",
            iconColor: "#1EAEDB",
            trend: stats.monthlyStats?.sessionsTrend ? {
              value: stats.monthlyStats.sessionsTrend,
              isPositive: stats.monthlyStats.sessionsTrend >= 0
            } : undefined
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
    <div className="space-y-6">
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
        <ProductivityInsights insights={dashboardData.insights} />
      </div>
    </div>
  );
};

export default DashboardContent;
