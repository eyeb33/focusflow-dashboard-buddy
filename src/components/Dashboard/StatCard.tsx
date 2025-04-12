
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className
}) => {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium">{title}</span>
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        
        <div className="flex items-center mt-2 text-xs">
          {trend ? (
            <>
              <span className={cn(
                "mr-1 flex items-center",
                trend.value > 0 ? "text-green-500" : 
                trend.value < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {trend.value > 0 ? <ArrowUp className="h-3 w-3 mr-0.5" /> : 
                 trend.value < 0 ? <ArrowDown className="h-3 w-3 mr-0.5" /> : 
                 <Minus className="h-3 w-3 mr-0.5" />}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-muted-foreground">from last week</span>
            </>
          ) : (
            <>
              <span className="mr-1 flex items-center text-muted-foreground">
                <Minus className="h-3 w-3 mr-0.5" />
                0%
              </span>
              <span className="text-muted-foreground">change from last week</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
