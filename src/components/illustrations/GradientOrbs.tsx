import React from 'react';

const GradientOrbs: React.FC<React.SVGAttributes<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="orb1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="orb2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="60" cy="40" r="36" fill="url(#orb1)" />
    <circle cx="140" cy="80" r="32" fill="url(#orb2)" />
  </svg>
);

export default GradientOrbs;

