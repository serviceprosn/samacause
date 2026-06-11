import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({ size = 36, className, style }) => {
  return (
    <img 
      src="/logo.png" 
      alt="Sunu Yité Logo" 
      width={size} 
      height={size} 
      className={className}
      style={{ 
        display: 'inline-block', 
        verticalAlign: 'middle', 
        objectFit: 'contain',
        ...style 
      }} 
    />
  );
};

export default Logo;
