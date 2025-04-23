
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Chart as ChartJS, 
  RadialLinearScale,
  LinearScale,
  PointElement, 
  LineElement, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';

ChartJS.register(
  RadialLinearScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface ExperimentalRadialChartProps {
  dailyData: ProductivityDataPoint[];
}

export const ExperimentalRadialChart: React.FC<ExperimentalRadialChartProps> = ({ dailyData }) => {
  const chartRef = useRef<ChartJS | null>(null);

  // Convert data points to radial coordinates with more points for smoother appearance
  const dataPoints = Array.from({ length: 72 }).map((_, index) => {
    const hour = Math.floor((index / 72) * 24); // Map index to 24-hour format
    const dataPoint = dailyData.find(d => parseInt(d.name) === hour) || { minutes: 0 };
    const angle = (index / 72) * Math.PI * 2;
    const baseRadius = 100; // Base radius for the circular shape
    const activityRadius = baseRadius + (dataPoint.minutes || 0);
    
    return {
      x: Math.cos(angle) * activityRadius,
      y: Math.sin(angle) * activityRadius,
    };
  });

  // Add the first point again to close the shape
  if (dataPoints.length > 0) {
    dataPoints.push(dataPoints[0]);
  }

  const createGradient = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
    gradient.addColorStop(0, 'rgba(255, 99, 132, 0.8)');    // Pink
    gradient.addColorStop(0.5, 'rgba(155, 135, 245, 0.8)'); // Purple
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0.8)');    // Blue
    return gradient;
  };

  const chartData = {
    datasets: [
      {
        data: dataPoints,
        backgroundColor: 'rgba(155, 135, 245, 0.1)',
        borderColor: function(context: any) {
          const chart = context.chart;
          const { ctx } = chart;
          return createGradient(ctx);
        },
        borderWidth: 3,
        showLine: true,
        tension: 0.4,
        fill: true,
        pointRadius: 0, // Hide individual points
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: 'linear' as const,
        display: false,
        min: -200,
        max: 200,
      },
      y: {
        type: 'linear' as const,
        display: false,
        min: -200,
        max: 200,
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
            const index = Math.floor((context.dataIndex / 72) * 24);
            const hour = index % 24;
            const data = dailyData.find(d => parseInt(d.name) === hour);
            return data ? `${hour}:00 - ${data.minutes} minutes` : '';
          },
        },
      },
    },
    aspectRatio: 1,
    responsive: true,
    maintainAspectRatio: true,
  };

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Focus Minutes Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="w-[400px] h-[400px]">
          <Scatter 
            data={chartData} 
            options={options}
            ref={(reference) => {
              if (reference !== null) {
                chartRef.current = reference;
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
