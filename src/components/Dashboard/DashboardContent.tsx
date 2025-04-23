
import React from "react";
import ChartsGrid from "@/components/Dashboard/ChartsGrid";
import ProductivityInsights from "@/components/Dashboard/ProductivityInsights";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";
import { TimePeriod } from "@/components/Dashboard/TimeToggle";
import { mockDashboardData } from "@/data/mockDashboardData";

interface DashboardContentProps {
  dashboardData: typeof mockDashboardData;
  selectedPeriod: TimePeriod;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  dashboardData,
  selectedPeriod,
}) => (
  <div className="space-y-6">
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

export default DashboardContent;
