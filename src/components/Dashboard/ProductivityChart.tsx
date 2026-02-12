
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';
import { TimePeriod } from './TimeToggle';

interface ProductivityChartProps {
  data: ProductivityDataPoint[];
  period: TimePeriod;
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({
  data,
  period
}) => {
  const getChartTitle = () => {
    switch (period) {
      case 'yesterday':
        return 'Yesterday\'s Productivity';
      case 'today':
        return 'Today\'s Productivity';
      case 'week':
        return 'This Week\'s Productivity';
      case 'month':
        return 'This Month\'s Productivity';
      default:
        return 'Productivity';
    }
  };

  const getMostProductiveTime = () => {
    if (!data.length) return null;

    const maxEntry = data.reduce((max, current) => 
      current.minutes > max.minutes ? current : max
    , data[0]);

    switch (period) {
      case 'yesterday':
      case 'today':
        return `${maxEntry.name} - ${parseInt(maxEntry.name) + 1}:00`;
      case 'week':
        return maxEntry.name;
      case 'month':
        return `Day ${maxEntry.name}`;
      default:
        return null;
    }
  };

  const mostProductiveTime = getMostProductiveTime();

  return (
    <Card className="h-full">
      <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-medium">{getChartTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="h-[220px] sm:h-[280px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                width={35}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderRadius: '8px', 
                  border: '1px solid hsl(var(--border))',
                  fontSize: '12px'
                }}
                formatter={(value) => [`${value} mins`, 'Focus Time']}
              />
              <Bar dataKey="minutes" fill="#ea384c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {mostProductiveTime && (
          <div className="mt-3 sm:mt-4 text-xs sm:text-sm">
            <span className="font-medium">Most productive time:</span>
            {' '}{mostProductiveTime}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductivityChart;
