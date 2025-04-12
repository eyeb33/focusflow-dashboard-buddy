
import React from 'react';
import InsightCard from './InsightCard';

const ProductivityInsights: React.FC = () => {
  return (
    <div className="bg-muted/40 rounded-lg p-6 border">
      <h2 className="text-lg font-medium mb-4">Productivity Insights</h2>
      <div className="space-y-4">
        <InsightCard 
          title="Best Focus Time"
          content={
            <>
              Your most productive hours are between <span className="text-pomodoro-work font-medium">2:00 PM - 4:00 PM</span>. 
              Consider scheduling your most important tasks during this time frame.
            </>
          }
        />
        <InsightCard 
          title="Session Length Analysis"
          content={
            <>
              You complete the most tasks when working in <span className="text-pomodoro-work font-medium">25-minute</span> focused sessions 
              followed by <span className="text-pomodoro-work font-medium">5-minute</span> breaks.
            </>
          }
        />
        <InsightCard 
          title="Productivity Trend"
          content={
            <>
              Your focus time has <span className="text-green-500 font-medium">increased by 15%</span> compared to last week. 
              Keep up the great work!
            </>
          }
        />
      </div>
    </div>
  );
};

export default ProductivityInsights;
