
import React from 'react';
import StatCard from "@/components/Dashboard/StatCard";
import { Clock, Flame, Target, Zap } from "lucide-react";

const StatCardsGrid: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      <StatCard
        title="Today's Focus"
        value="125 min"
        icon={<Clock className="h-4 w-4" />}
        trend={{ value: 15, isPositive: true }}
      />
      <StatCard
        title="Current Streak"
        value="7 days"
        icon={<Flame className="h-4 w-4" />}
        trend={{ value: 40, isPositive: true }}
      />
      <StatCard
        title="Completion Rate"
        value="85%"
        icon={<Target className="h-4 w-4" />}
        trend={{ value: 5, isPositive: false }}
      />
      <StatCard
        title="Weekly Sessions"
        value="32"
        icon={<Zap className="h-4 w-4" />}
        description="Total focus sessions this week"
      />
    </div>
  );
};

export default StatCardsGrid;
