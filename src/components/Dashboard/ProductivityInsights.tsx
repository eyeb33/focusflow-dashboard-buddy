
import React from 'react';
import InsightCard from './InsightCard';

interface Insight {
  title: string;
  content: string;
}

interface ProductivityInsightsProps {
  insights: Insight[];
}

const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({ insights }) => {
  return (
    <div className="bg-muted/40 rounded-lg p-6 border">
      <h2 className="text-lg font-medium mb-4">Productivity Insights</h2>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <InsightCard 
            key={index}
            title={insight.title}
            content={insight.content}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductivityInsights;
