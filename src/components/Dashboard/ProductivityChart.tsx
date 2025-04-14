import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';

interface ProductivityChartProps {
  dailyData: ProductivityDataPoint[];
  weeklyData: ProductivityDataPoint[];
  monthlyData: ProductivityDataPoint[];
  bestHour?: string;
}

const ProductivityChart: React.FC<ProductivityChartProps> = ({
  dailyData,
  weeklyData,
  monthlyData,
  bestHour
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Productivity Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="daily">Today</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #eaeaea' }}
                  formatter={(value) => [`${value} mins`, 'Focus Time']}
                />
                <Bar dataKey="minutes" fill="#9b87f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {bestHour && (
              <div className="mt-4 text-sm">
                <span className="font-medium">Most productive time:</span> {bestHour}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="weekly" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #eaeaea' }}
                  formatter={(value, name) => [name === 'sessions' ? `${value} sessions` : `${value} mins`, name === 'sessions' ? 'Sessions' : 'Focus Time']}
                />
                <Bar dataKey="sessions" fill="#7E69AB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="minutes" fill="#9b87f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="monthly" className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #eaeaea' }}
                  formatter={(value) => [`${value} sessions`, 'Sessions']}
                />
                <Bar dataKey="sessions" fill="#9b87f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProductivityChart;
