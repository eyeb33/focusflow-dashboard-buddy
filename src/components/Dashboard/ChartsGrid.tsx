
import React from 'react';
import ProductivityChart from "@/components/Dashboard/ProductivityChart";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";
import { mockStreakData, mockDailyData, mockWeeklyData, mockMonthlyData } from "@/data/mockDashboardData";

const ChartsGrid: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <div className="lg:col-span-2">
        <ProductivityChart 
          dailyData={mockDailyData}
          weeklyData={mockWeeklyData}
          monthlyData={mockMonthlyData}
          bestHour="2:00 PM - 4:00 PM"
        />
      </div>
      <div>
        <StreakCalendar 
          data={mockStreakData}
          currentStreak={7}
          bestStreak={12}
        />
      </div>
    </div>
  );
};

export default ChartsGrid;
