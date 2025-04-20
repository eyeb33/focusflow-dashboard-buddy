
import React from 'react';

/**
 * CycleIcon displays a three-part cycle as an SVG, with each arc in a different theme color.
 */
const CycleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block' }}
  >
    {/* Red arc */}
    <path
      d="M32 9.2A15 15 0 0 0 8 9.2"
      stroke="#ea384c"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Green arc */}
    <path
      d="M6 20a14.96 14.96 0 0 0 6.14 10.74"
      stroke="#F2FCE2"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Blue arc */}
    <path
      d="M25.14 30.74A15 15 0 0 0 34 20"
      stroke="#1EAEDB"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
    {/* Arrows - for cycle effect */}
    <polygon points="11,9 8,7 8,11" fill="#ea384c" />
    <polygon points="6,21 3,19 6,17" fill="#F2FCE2" />
    <polygon points="29,32 25,31 28,29" fill="#1EAEDB" />
  </svg>
);

export default CycleIcon;
