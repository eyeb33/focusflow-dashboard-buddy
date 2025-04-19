
import React from 'react';
import StatCard from "@/components/Dashboard/StatCard";
import { Clock, Flame, Target, Zap } from "lucide-react";

export interface StatItem {
  title: string;
  value: string | number; // Update the value type to accept both string and number
  icon: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
}

interface StatCardsGridProps {
  stats: StatItem[];
}

const StatCardsGrid: React.FC<StatCardsGridProps> = ({ stats }) => {
  const getIconComponent = (iconName: string, iconColor?: string) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="h-4 w-4" color={iconColor} />;
      case 'Flame':
        return <Flame className="h-4 w-4" color={iconColor} />;
      case 'Target':
        return <Target className="h-4 w-4" color={iconColor} />;
      case 'Zap':
        return <Zap className="h-4 w-4" color={iconColor} />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={getIconComponent(stat.icon, stat.iconColor)}
          description={stat.description}
          trend={stat.trend}
          iconColor={stat.iconColor}
        />
      ))}
    </div>
  );
};

export default StatCardsGrid;
