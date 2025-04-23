
import React from 'react';
import { Recycle } from 'lucide-react';

const CycleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Recycle size={size} className="text-purple-500" />
);

export default CycleIcon;
