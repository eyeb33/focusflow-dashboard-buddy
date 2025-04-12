
import React from 'react';
import StatCard from "@/components/Dashboard/StatCard";
import { Clock, Flame, Target, Zap } from "lucide-react";

interface StatItem {
  title: string;
  value: string;
  icon: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface StatCardsGridProps {
  stats: StatItem[];
}

const StatCardsGrid: React.FC<StatCardsGridProps> = ({ stats }) => {
  // Function to get the appropriate icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Clock':
        return <Clock className="h-4 w-4" />;
      case 'Flame':
        return <Flame className="h-4 w-4" />;
      case 'Target':
        return <Target className="h-4 w-4" />;
      case 'Zap':
        return <Zap className="h-4 w-4" />;
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
          icon={getIconComponent(stat.icon)}
          description={stat.description}
          trend={stat.trend}
        />
      ))}
    </div>
  );
};

export default StatCardsGrid;
