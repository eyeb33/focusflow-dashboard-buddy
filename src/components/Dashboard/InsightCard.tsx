
import React from 'react';

interface InsightCardProps {
  title: string;
  content: React.ReactNode;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, content }) => {
  return (
    <div className="bg-white rounded-md p-4 border">
      <h3 className="font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{content}</p>
    </div>
  );
};

export default InsightCard;
