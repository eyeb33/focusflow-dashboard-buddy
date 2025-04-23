
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductivityDataPoint } from '@/hooks/dashboard/productivity/types';

interface ExperimentalRadialChartProps {
  dailyData: ProductivityDataPoint[];
}

export const ExperimentalRadialChart: React.FC<ExperimentalRadialChartProps> = ({ dailyData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) / 2.5;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(255, 99, 132, 0.8)');    // Pink
    gradient.addColorStop(0.5, 'rgba(155, 135, 245, 0.8)'); // Purple
    gradient.addColorStop(1, 'rgba(14, 165, 233, 0.8)');    // Blue

    // Draw base circle (faint outline)
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(155, 135, 245, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Prepare data points
    const maxMinutes = Math.max(25, ...dailyData.map(d => d.minutes || 0));
    const points: {x: number, y: number, hour: number, minutes: number}[] = [];
    
    // Generate points for each hour with more resolution for smoothness
    for (let i = 0; i < 144; i++) {
      const hourIndex = Math.floor((i / 144) * 24);
      const hour = hourIndex % 24;
      const angle = (i / 144) * Math.PI * 2;
      
      const dataPoint = dailyData.find(d => parseInt(d.name) === hour) || { name: hour.toString(), minutes: 0, sessions: 0 };
      const scaleFactor = 0.1 + (dataPoint.minutes / maxMinutes) * 0.9; // Always have at least a small circle
      const radius = baseRadius * scaleFactor;
      
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        hour,
        minutes: dataPoint.minutes
      });
    }
    
    // Draw the data shape
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      // Use quadratic curve for smoother lines
      const prevPoint = points[i-1];
      const currentPoint = points[i];
      const cpX = (prevPoint.x + currentPoint.x) / 2;
      const cpY = (prevPoint.y + currentPoint.y) / 2;
      
      ctx.quadraticCurveTo(cpX, cpY, currentPoint.x, currentPoint.y);
    }
    
    // Close the path back to the first point
    ctx.closePath();
    
    // Fill with transparent color
    ctx.fillStyle = 'rgba(155, 135, 245, 0.1)';
    ctx.fill();
    
    // Stroke with gradient
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw hour markers
    for (let hour = 0; hour < 24; hour++) {
      const angle = (hour / 24) * Math.PI * 2;
      const markerX = centerX + Math.cos(angle) * baseRadius;
      const markerY = centerY + Math.sin(angle) * baseRadius;
      
      // Small dot for each hour
      ctx.beginPath();
      ctx.arc(markerX, markerY, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
      
      // Hour label for every 3 hours
      if (hour % 3 === 0) {
        const textDistance = baseRadius + 15;
        const textX = centerX + Math.cos(angle) * textDistance;
        const textY = centerY + Math.sin(angle) * textDistance;
        
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hour.toString(), textX, textY);
      }
    }
    
    // Draw hour highlights for hours with activity
    dailyData.forEach(dataPoint => {
      if (dataPoint.minutes > 0) {
        const hour = parseInt(dataPoint.name);
        const angle = (hour / 24) * Math.PI * 2;
        const scaleFactor = 0.1 + (dataPoint.minutes / maxMinutes) * 0.9;
        const radius = baseRadius * scaleFactor;
        
        const pointX = centerX + Math.cos(angle) * radius;
        const pointY = centerY + Math.sin(angle) * radius;
        
        // Draw highlighted point
        ctx.beginPath();
        ctx.arc(pointX, pointY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        // Optional: Add minute label for significant activity
        if (dataPoint.minutes > maxMinutes * 0.5) {
          const labelRadius = radius + 10;
          const labelX = centerX + Math.cos(angle) * labelRadius;
          const labelY = centerY + Math.sin(angle) * labelRadius;
          
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${dataPoint.minutes}m`, labelX, labelY);
        }
      }
    });
    
  }, [dailyData]);

  // Set up tooltip handling
  const [tooltip, setTooltip] = React.useState<{
    show: boolean;
    x: number;
    y: number;
    hour: number;
    minutes: number;
  }>({ show: false, x: 0, y: 0, hour: 0, minutes: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    
    // Calculate distance and angle from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only show tooltip if within the chart area
    if (distance <= Math.min(canvasRef.current.width, canvasRef.current.height) / 2) {
      // Calculate angle (in radians)
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;
      
      // Convert angle to hour (0-23)
      const hour = Math.floor((angle / (Math.PI * 2)) * 24) % 24;
      
      // Find the corresponding data point
      const dataPoint = dailyData.find(d => parseInt(d.name) === hour);
      
      setTooltip({
        show: true,
        x: e.clientX,
        y: e.clientY,
        hour,
        minutes: dataPoint?.minutes || 0
      });
    } else {
      setTooltip(prev => ({ ...prev, show: false }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Focus Minutes Distribution</CardTitle>
      </CardHeader>
      <CardContent className="relative flex justify-center overflow-hidden">
        <div className="relative w-[400px] h-[400px]">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={400}
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          {tooltip.show && (
            <div 
              className="absolute z-10 px-3 py-2 text-sm bg-background border border-border rounded shadow-lg pointer-events-none"
              style={{ 
                left: `${tooltip.x}px`, 
                top: `${tooltip.y - 40}px`,
                transform: 'translateX(-50%)' 
              }}
            >
              <div className="font-medium">{tooltip.hour}:00</div>
              <div className="text-xs">{tooltip.minutes} minutes</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
