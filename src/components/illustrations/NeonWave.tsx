import React from 'react';

const NeonWave: React.FC<React.SVGAttributes<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 600 140" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <linearGradient id="nw1" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="100%" stopColor="#00E5FF" />
      </linearGradient>
    </defs>
    {/* Subtle stroked waves, no orbs */}
    <path d="M0,90 C120,40 300,140 460,70 C520,45 560,60 600,70" stroke="url(#nw1)" strokeWidth="2" opacity="0.5" />
    <path d="M0,105 C120,55 300,155 460,85 C520,60 560,75 600,85" stroke="url(#nw1)" strokeWidth="1.5" opacity="0.3" />
  </svg>
);

export default NeonWave;
