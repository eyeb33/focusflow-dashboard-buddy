
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
      <CardHeader>
        <CardTitle className="text-lg font-medium">{getChartTitle()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #eaeaea' }}
                formatter={(value) => [`${value} mins`, 'Focus Time']}
              />
              <Bar dataKey="minutes" fill="#ea384c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {mostProductiveTime && (
          <div className="mt-4 text-sm">
            <span className="font-medium">Most productive time:</span>
            {' '}{mostProductiveTime}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductivityChart;
