
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Tooltip, Legend);

interface ExperimentalRadialChartProps {
  dailyData: ProductivityDataPoint[];
}

export const ExperimentalRadialChart: React.FC<ExperimentalRadialChartProps> = ({ dailyData }) => {
  // Convert data points to radial coordinates
  const dataPoints = dailyData.map((point, index) => {
    const angle = (index / dailyData.length) * Math.PI * 2;
    const radius = point.minutes || 0;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });

  // Add the first point again to close the shape
  if (dataPoints.length > 0) {
    dataPoints.push(dataPoints[0]);
  }

  const chartData = {
    datasets: [
      {
        data: dataPoints,
        backgroundColor: 'rgba(155, 135, 245, 0.1)',
        borderColor: 'rgba(155, 135, 245, 1)',
        borderWidth: 2,
        showLine: true,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        display: false,
      },
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            if (index < dailyData.length) {
              return `${dailyData[index].minutes} minutes`;
            }
            return '';
          },
        },
      },
    },
    aspectRatio: 1,
    responsive: true,
    maintainAspectRatio: true,
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Focus Minutes Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="w-[400px] h-[400px]">
          <Scatter data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};
