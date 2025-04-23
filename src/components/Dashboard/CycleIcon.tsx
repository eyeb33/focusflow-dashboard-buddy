
import React from 'react';
import { Cycle } from 'lucide-react';

const CycleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Cycle size={size} className="text-purple-500" />
);

export default CycleIcon;
