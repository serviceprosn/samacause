import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({ size = 36, className, style }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <defs>
        {/* Green Top Gradient */}
        <linearGradient id="greenGrad" x1="10" y1="5" x2="90" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#00853F" />
        </linearGradient>
        
        {/* Yellow/Orange Bottom Gradient */}
        <linearGradient id="yellowGrad" x1="10" y1="55" x2="90" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCD116" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      {/* Top Green Chevron */}
      <path 
        d="M 10 44 
           L 10 28 
           Q 10 24 13.5 22 
           L 46.5 6 
           Q 50 4.2 53.5 6 
           L 86.5 22 
           Q 90 24 90 28 
           L 90 44 
           Q 90 46.5 87.5 45.5 
           L 76 40 
           Q 73.5 38.8 72.5 36.5 
           L 53.5 21 
           Q 50 18.2 46.5 21 
           L 27.5 36.5 
           Q 26.5 38.8 24 40 
           L 12.5 45.5 
           Q 10 46.5 10 44 Z" 
        fill="url(#greenGrad)" 
      />

      {/* Bottom Yellow/Orange Chevron */}
      <path 
        d="M 90 56 
           L 90 72 
           Q 90 76 86.5 78 
           L 53.5 94 
           Q 50 95.8 46.5 94 
           L 13.5 78 
           Q 10 76 10 72 
           L 10 56 
           Q 10 53.5 12.5 54.5 
           L 24 60 
           Q 26.5 61.2 27.5 63.5 
           L 46.5 79 
           Q 50 81.8 53.5 79 
           L 72.5 63.5 
           Q 73.5 61.2 76 60 
           L 87.5 54.5 
           Q 90 53.5 90 56 Z" 
        fill="url(#yellowGrad)" 
      />

      {/* Central Green Circle */}
      <circle 
        cx="50" 
        cy="50" 
        r="11" 
        fill="#00853F" 
      />
    </svg>
  );
};

export default Logo;
