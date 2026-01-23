
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
  // Only show trend if value is not zero and trend exists
  const shouldShowTrend = trend && Number(value) !== 0;

  return (
    <Card className={cn(
      "h-full border-0 bg-card/60 backdrop-blur-sm shadow-soft hover:shadow-soft-lg transition-all duration-200",
      "touch-manipulation",
      className
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0",
        compact ? "pb-2 p-4 sm:p-6 sm:pb-3" : "pb-3 p-4 sm:p-6"
      )}>
        <span className={cn(
          "font-medium",
          compact ? "text-xs sm:text-sm" : "text-sm"
        )}>{title}</span>
        <div
          className={cn(
            "rounded-full flex items-center justify-center shadow-soft flex-shrink-0",
            compact ? "h-7 w-7 sm:h-8 sm:w-8" : "h-8 w-8 sm:h-9 sm:w-9",
            iconColor ? `bg-opacity-20` : ""
          )}
          style={iconColor ? { backgroundColor: `${iconColor}20` } : {}}
        >
          {React.cloneElement(icon as React.ReactElement, {
            color: iconColor,
            size: compact ? 14 : 16
          })}
        </div>
      </CardHeader>
      <CardContent className={cn(
        "pt-0",
        compact ? "p-4 sm:p-6" : "p-4 sm:p-6"
      )}>
        <div className={cn(
          "font-bold",
          compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
        )}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        <div className="flex items-center mt-1 sm:mt-2 text-xs">
          {shouldShowTrend && (
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
              <span className="text-muted-foreground">from yesterday</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
