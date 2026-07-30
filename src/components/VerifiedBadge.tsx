import React from 'react';

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  showTooltip?: boolean;
  variant?: 'emerald' | 'blue' | 'gold';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 20,
  className = '',
  style = {},
  showTooltip = true,
  variant = 'emerald'
}) => {
  const gradientId = React.useId ? React.useId().replace(/:/g, '') : `vgrad_${Math.floor(Math.random()*100000)}`;

  const gradients = {
    emerald: { start: '#00853F', end: '#10B981', shadow: 'rgba(0, 133, 63, 0.4)' },
    blue: { start: '#1E40AF', end: '#3B82F6', shadow: 'rgba(59, 130, 246, 0.4)' },
    gold: { start: '#D97706', end: '#F59E0B', shadow: 'rgba(245, 158, 11, 0.4)' }
  };

  const currentGrad = gradients[variant] || gradients.emerald;

  return (
    <span 
      className={`inline-flex items-center align-middle ${className}`}
      style={{ display: 'inline-flex', verticalAlign: 'middle', flexShrink: 0, cursor: 'pointer', ...style }}
      title={showTooltip ? "Identité Certifiée & Vérifiée KYC (Sunu Yité)" : undefined}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0px 2px 4px ${currentGrad.shadow})`,
          transform: 'translateZ(0)'
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentGrad.start} />
            <stop offset="100%" stopColor={currentGrad.end} />
          </linearGradient>
        </defs>

        {/* Official 12-point scalloped verification rosette */}
        <path 
          d="M12 2C12.5 2.7 13.4 3 14.3 3C15.2 3 16.1 2.7 16.6 2C17.3 2.7 18.2 3 19.1 2.8C20 2.6 20.8 3.1 21.1 3.9C21.4 4.7 21.3 5.7 21.9 6.4C22.5 7.1 23.4 7.3 23.9 8C24.4 8.7 24.4 9.7 24.1 10.5C23.8 11.3 24 12.3 24.7 13C24 13.7 23.8 14.7 24.1 15.5C24.4 16.3 24.4 17.3 23.9 18C23.4 18.7 22.5 18.9 21.9 19.6C21.3 20.3 21.4 21.3 21.1 22.1C20.8 22.9 20 23.4 19.1 23.2C18.2 23 17.3 23.3 16.6 24C16.1 23.3 15.2 23 14.3 23C13.4 23 12.5 23.3 12 24C11.5 23.3 10.6 23 9.7 23C8.8 23 7.9 23.3 7.4 24C6.7 23.3 5.8 23 4.9 23.2C4 23.4 3.2 22.9 2.9 22.1C2.6 21.3 2.7 20.3 2.1 19.6C1.5 18.9 0.6 18.7 0.1 18C-0.4 17.3 -0.4 16.3 -0.1 15.5C0.2 14.7 0 13.7 -0.7 13C0 12.3 0.2 11.3 -0.1 10.5C-0.4 9.7 -0.4 8.7 0.1 8C0.6 7.3 1.5 7.1 2.1 6.4C2.7 5.7 2.6 4.7 2.9 3.9C3.2 3.1 4 2.6 4.9 2.8C5.8 3 6.7 2.7 7.4 2C7.9 2.7 8.8 3 9.7 3C10.6 3 11.5 2.7 12 2Z" 
          transform="scale(0.85) translate(2.1, 2.1)"
          fill={`url(#${gradientId})`} 
        />

        {/* Clean, bold white checkmark */}
        <path 
          d="M9 12.3L11.2 14.5L15.8 9.5" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </span>
  );
};
