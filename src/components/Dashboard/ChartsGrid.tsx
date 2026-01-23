
import React from 'react';
import ProductivityChart from "./ProductivityChart";
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';
import { TimePeriod } from './TimeToggle';

interface ChartsGridProps {
  dailyData: ProductivityDataPoint[];
  weeklyData: ProductivityDataPoint[];
  monthlyData: ProductivityDataPoint[];
  selectedPeriod: TimePeriod;
}

const ChartsGrid: React.FC<ChartsGridProps> = ({ 
  dailyData, 
  weeklyData, 
  monthlyData, 
  selectedPeriod
}) => {
  const getActiveData = () => {
    switch (selectedPeriod) {
      case 'yesterday':
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
    <div className="grid gap-4 md:gap-6 mb-4 md:mb-8">
      <div className="w-full">
        <ProductivityChart 
          data={getActiveData()}
          period={selectedPeriod}
        />
      </div>
    </div>
  );
};

export default ChartsGrid;
