
import React from 'react';
import ProductivityChart from "./ProductivityChart";
import StreakCalendar from "./StreakCalendar";
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';
import { TimePeriod } from './TimeToggle';

interface StreakDataType {
  date: string;
  completed: number;
}

interface ChartsGridProps {
  dailyData: ProductivityDataPoint[];
  weeklyData: ProductivityDataPoint[];
  monthlyData: ProductivityDataPoint[];
  streakData: StreakDataType[];
  currentStreak: number;
  bestStreak: number;
  selectedPeriod: TimePeriod;
}

const ChartsGrid: React.FC<ChartsGridProps> = ({ 
  dailyData, 
  weeklyData, 
  monthlyData, 
  streakData,
  currentStreak,
  bestStreak,
  selectedPeriod
}) => {
  const getActiveData = () => {
    switch (selectedPeriod) {
      case 'today':
        return dailyData;
      case 'week':
        return weeklyData;
      case 'month':
        return monthlyData;
      default:
        return dailyData;
    }
  };

  return (
    <div className="grid gap-6 mb-8">
      <div className="w-full">
        <ProductivityChart 
          data={getActiveData()}
          period={selectedPeriod}
          bestHour={selectedPeriod === 'today' ? "2:00 PM - 4:00 PM" : undefined}
        />
      </div>
    </div>
  );
};

export default ChartsGrid;
