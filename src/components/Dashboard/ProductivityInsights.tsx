
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
    <div className="bg-card/60 backdrop-blur-sm rounded-xl p-8 border border-border/50 shadow-soft">
      <h2 className="text-lg font-semibold mb-6">Productivity Insights</h2>
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
