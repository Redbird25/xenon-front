import React from 'react';

const DotsGrid: React.FC<React.SVGAttributes<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" {...props}>
    {Array.from({ length: 10 }).map((_, r) => (
      Array.from({ length: 16 }).map((__, c) => (
        <circle key={`${r}-${c}`} cx={10 + c * 12} cy={10 + r * 12} r={1.5} fill="currentColor" opacity={0.2} />
      ))
    ))}
  </svg>
);

export default DotsGrid;

