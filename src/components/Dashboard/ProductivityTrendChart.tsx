
import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface ProductivityTrendChartProps {
  data: {
    date: string;
    productivity: number;
  }[];
}

const ProductivityTrendChart = ({ data }: ProductivityTrendChartProps) => {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Productivity Trend</CardTitle>
        <CardDescription>Your focus time over the past 30 days</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        <ChartContainer
          config={{
            productivity: {
              label: "Productivity Score",
              theme: {
                light: "#9b87f5",
                dark: "#9b87f5",
              },
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: -10,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9b87f5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#9b87f5" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.getDate().toString();
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Area
                type="natural"
                dataKey="productivity"
                name="productivity"
                stroke="#9b87f5"
                strokeWidth={2.5}
                fill="url(#productivityGradient)"
                dot={{ strokeWidth: 2, r: 2, fill: "white" }}
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ProductivityTrendChart;
