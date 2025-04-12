
import React from 'react';
import ProductivityChart from "@/components/Dashboard/ProductivityChart";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";

interface ChartDataType {
  name: string;
  sessions: number;
  minutes: number;
}

interface StreakDataType {
  date: string;
  completed: number;
}

interface ChartsGridProps {
  dailyData: ChartDataType[];
  weeklyData: ChartDataType[];
  monthlyData: ChartDataType[];
  streakData: StreakDataType[];
  currentStreak: number;
  bestStreak: number;
}

const ChartsGrid: React.FC<ChartsGridProps> = ({ 
  dailyData, 
  weeklyData, 
  monthlyData, 
  streakData,
  currentStreak,
  bestStreak
}) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <div className="lg:col-span-2">
        <ProductivityChart 
          dailyData={dailyData}
          weeklyData={weeklyData}
          monthlyData={monthlyData}
          bestHour="2:00 PM - 4:00 PM"
        />
      </div>
      <div>
        <StreakCalendar 
          data={streakData}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
        />
      </div>
    </div>
  );
};

export default ChartsGrid;
