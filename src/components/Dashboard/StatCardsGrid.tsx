
import React from 'react';
import StatCard from "@/components/Dashboard/StatCard";
import { Clock, Flame, Activity } from "lucide-react";
import CycleIcon from "@/components/Dashboard/CycleIcon";

export interface StatItem {
  title: string;
  value: string | number;
  icon: string | React.ReactNode;
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
  const getIconComponent = (iconNameOrNode: string | React.ReactNode, iconColor?: string) => {
    if (React.isValidElement(iconNameOrNode)) return iconNameOrNode;
    switch (iconNameOrNode) {
      case 'Clock':
        return <Clock className="h-5 w-5" color={iconColor} />;
      case 'Flame':
        return <Flame className="h-5 w-5" color={iconColor} />;
      case 'Cycle':
        return <CycleIcon size={28} />;
      case 'Activity':
        return <Activity className="h-5 w-5" color={iconColor} />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 w-full">
      {stats.map((stat, index) => (
        <div key={index} className="w-full">
          <StatCard
            title={stat.title}
            value={stat.value}
            icon={getIconComponent(stat.icon, stat.iconColor)}
            description={stat.description}
            trend={stat.trend}
            iconColor={stat.iconColor}
            className="min-h-[100px] md:min-h-[120px] w-full"
            compact={true}
          />
        </div>
      ))}
    </div>
  );
};

export default StatCardsGrid;
