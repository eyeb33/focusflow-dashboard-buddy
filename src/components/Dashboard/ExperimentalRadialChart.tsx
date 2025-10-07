
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';
import { Clock } from 'lucide-react';

interface ExperimentalRadialChartProps {
  dailyData: ProductivityDataPoint[];
}

export const ExperimentalRadialChart: React.FC<ExperimentalRadialChartProps> = ({ dailyData }) => {
  // Process data to group by time periods
  const processedData = React.useMemo(() => {
    const periods = [
      { name: 'Morning', hours: [6, 7, 8, 9, 10, 11], color: 'from-amber-400 to-orange-500', bgColor: 'bg-amber-500/20' },
      { name: 'Afternoon', hours: [12, 13, 14, 15, 16, 17], color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-500/20' },
      { name: 'Evening', hours: [18, 19, 20, 21, 22, 23], color: 'from-purple-400 to-pink-500', bgColor: 'bg-purple-500/20' },
      { name: 'Night', hours: [0, 1, 2, 3, 4, 5], color: 'from-slate-400 to-slate-600', bgColor: 'bg-slate-500/20' }
    ];

    return periods.map(period => {
      const totalMinutes = period.hours.reduce((sum, hour) => {
        const dataPoint = dailyData.find(d => parseInt(d.name) === hour);
        return sum + (dataPoint?.minutes || 0);
      }, 0);

      const totalSessions = period.hours.reduce((sum, hour) => {
        const dataPoint = dailyData.find(d => parseInt(d.name) === hour);
        return sum + (dataPoint?.sessions || 0);
      }, 0);

      return {
        ...period,
        minutes: totalMinutes,
        sessions: totalSessions
      };
    });
  }, [dailyData]);

  const maxMinutes = Math.max(...processedData.map(d => d.minutes), 1);
  const totalMinutes = processedData.reduce((sum, d) => sum + d.minutes, 0);

  // Find peak period
  const peakPeriod = processedData.reduce((max, period) => 
    period.minutes > max.minutes ? period : max
  , processedData[0]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Daily Focus Pattern</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{totalMinutes} min total</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {processedData.map((period, index) => {
          const percentage = maxMinutes > 0 ? (period.minutes / maxMinutes) * 100 : 0;
          const isPeak = period.name === peakPeriod.name && period.minutes > 0;
          
          return (
            <div key={period.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium min-w-[80px]">{period.name}</span>
                  {isPeak && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                      Peak
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{period.sessions} sessions</span>
                  <span className="font-semibold text-foreground">{period.minutes} min</span>
                </div>
              </div>
              <div className="relative h-8 bg-muted/40 rounded-lg overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${period.color} transition-all duration-500 ease-out rounded-lg`}
                  style={{ width: `${percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          );
        })}
        
        {totalMinutes === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No focus sessions recorded yet today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
