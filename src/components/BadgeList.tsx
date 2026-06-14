import React from 'react';
import { Badge } from '../types';
import { useApp } from '../context/AppContext';

interface BadgeListProps {
  unlockedBadgeIds: string[];
}

export const BadgeList: React.FC<BadgeListProps> = ({ unlockedBadgeIds }) => {
  const { badges } = useApp();

  return (
    <div className="grid-cols-2" style={{ gap: '1rem', marginTop: '1rem' }}>
      {badges.map((badge) => {
        const isUnlocked = Array.isArray(unlockedBadgeIds) ? unlockedBadgeIds.includes(badge.id) : false;

        return (
          <div 
            key={badge.id}
            className="premium-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              opacity: isUnlocked ? 1 : 0.45,
              filter: isUnlocked ? 'none' : 'grayscale(100%)',
              border: isUnlocked ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
              background: isUnlocked ? 'var(--light-card)' : 'rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden',
              padding: '1rem'
            }}
          >
            {isUnlocked && (
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.4rem',
                  borderBottomLeftRadius: '8px',
                  fontWeight: 'bold'
                }}
              >
                ACQUIS
              </div>
            )}
            
            <div style={{ fontSize: '2.5rem', userSelect: 'none' }}>
              {badge.icon}
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0, color: isUnlocked ? 'var(--primary)' : 'var(--text-primary-light)' }}>
                {badge.name}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginTop: '0.2rem', lineHeight: 1.3 }}>
                {badge.description}
              </p>
              {!isUnlocked && (
                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', marginTop: '0.25rem' }}>
                  🔑 À débloquer
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
