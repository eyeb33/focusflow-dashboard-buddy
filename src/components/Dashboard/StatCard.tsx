
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
  iconColor?: string;
  compact?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className,
  iconColor,
  compact = false
}) => {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0",
        compact ? "pb-2" : "pb-2"
      )}>
        <span className={cn(
          "font-medium",
          compact ? "text-sm" : "text-sm"
        )}>{title}</span>
        <div 
          className={cn(
            "rounded-full flex items-center justify-center",
            compact ? "h-7 w-7" : "h-8 w-8",
            iconColor && `bg-[${iconColor}] bg-opacity-20`
          )}
        >
          {React.cloneElement(icon as React.ReactElement, { 
            color: iconColor,
            size: compact ? 16 : 18
          })}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "font-bold",
          compact ? "text-xl" : "text-2xl"
        )}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        
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
              <span className="text-muted-foreground">from previous period</span>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
