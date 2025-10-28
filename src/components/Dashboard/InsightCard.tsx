
import React from 'react';

interface InsightCardProps {
  title: string;
  content: React.ReactNode;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, content }) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border/50 shadow-soft hover:shadow-soft-lg transition-all duration-200">
      <h3 className="font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{content}</p>
    </div>
  );
};

export default InsightCard;
