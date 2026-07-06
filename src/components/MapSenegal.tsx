import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

interface RegionData {
  name: string;
  x: number;
  y: number;
  color: string;
}

interface MapSenegalProps {
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
  petitions: any[];
  cagnottes: any[];
  tontines: any[];
  volunteerMissions: any[];
}

export const MapSenegal: React.FC<MapSenegalProps> = ({
  selectedRegion,
  onSelectRegion,
  petitions,
  cagnottes,
  tontines,
  volunteerMissions
}) => {
  const { t } = useLanguage();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const regions: RegionData[] = [
    { name: 'Dakar', x: 35, y: 155, color: '#00853F' },
    { name: 'Thiès', x: 75, y: 145, color: '#FCD116' },
    { name: 'Diourbel', x: 110, y: 140, color: '#E31B23' },
    { name: 'Fatick', x: 95, y: 185, color: '#3b82f6' },
    { name: 'Kaolack', x: 135, y: 195, color: '#8b5cf6' },
    { name: 'Kaffrine', x: 185, y: 185, color: '#ec4899' },
    { name: 'Louga', x: 145, y: 95, color: '#10b981' },
    { name: 'Saint-Louis', x: 115, y: 45, color: '#f59e0b' },
    { name: 'Matam', x: 275, y: 90, color: '#06b6d4' },
    { name: 'Tambacounda', x: 300, y: 200, color: '#f97316' },
    { name: 'Kédougou', x: 350, y: 280, color: '#84cc16' },
    { name: 'Kolda', x: 200, y: 265, color: '#00853F' },
    { name: 'Sédhiou', x: 135, y: 270, color: '#FCD116' },
    { name: 'Ziguinchor', x: 75, y: 275, color: '#E31B23' }
  ];

  // Helper to count active initiatives in a region
  const getRegionStats = (regionName: string) => {
    const filterFn = (item: any) => 
      item.status === 'active' && 
      item.location && 
      item.location.toLowerCase().includes(regionName.toLowerCase());

    const activePetitions = petitions.filter(filterFn).length;
    const activeCagnottes = cagnottes.filter(filterFn).length;
    const activeTontines = tontines.filter(item => 
      (item.status === 'active' || item.status === 'recruiting' || !item.status) && 
      item.location && 
      item.location.toLowerCase().includes(regionName.toLowerCase())
    ).length;
    const activeMissions = volunteerMissions.filter(filterFn).length;

    const total = activePetitions + activeCagnottes + activeTontines + activeMissions;

    return {
      petitions: activePetitions,
      cagnottes: activeCagnottes,
      tontines: activeTontines,
      missions: activeMissions,
      total
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 10
    });
  };

  return (
    <div 
      className="premium-card"
      style={{
        padding: '1.5rem',
        background: 'var(--light-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        marginBottom: '2rem',
        overflow: 'hidden'
      }}
      onMouseMove={handleMouseMove}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
            🗺️ Carte Interactive des Régions
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginTop: '0.2rem', margin: 0 }}>
            Pulsations en temps réel. Cliquez sur un nœud pour filtrer la liste par région.
          </p>
        </div>
        {selectedRegion && (
          <button
            className="btn btn-ghost"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.7rem',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.05)'
            }}
            onClick={() => onSelectRegion(null)}
          >
            Réinitialiser ✕
          </button>
        )}
      </div>

      <div 
        style={{
          width: '100%',
          height: '240px',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.02)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}
      >
        <svg 
          viewBox="0 0 420 320" 
          style={{
            width: '100%',
            height: '100%',
            maxHeight: '230px',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Stylized Senegal Outline */}
          <path
            d="M 120,40 C 150,20 220,50 270,75 C 310,95 340,110 370,160 C 390,190 410,210 405,245 C 400,270 380,285 365,305 C 350,320 340,300 320,290 C 290,275 250,280 220,280 C 190,280 180,250 160,250 C 140,250 120,285 95,290 C 70,295 50,290 45,260 C 40,240 65,240 90,240 C 120,240 170,230 170,210 C 170,200 120,200 90,200 C 65,200 40,210 35,185 C 32,170 15,160 25,145 C 35,130 55,145 75,130 C 95,115 100,70 120,40 Z"
            fill="var(--border-light)"
            stroke="var(--border-light)"
            strokeWidth="2"
            opacity="0.45"
            style={{
              transition: 'fill 0.3s ease',
              filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.03))'
            }}
          />

          {/* Stylized Gambia River Cutout */}
          <path
            d="M 35,215 L 170,215 C 175,215 175,225 170,225 L 35,225"
            fill="none"
            stroke="var(--light-card)"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Region Nodes */}
          {regions.map((region) => {
            const stats = getRegionStats(region.name);
            const isSelected = selectedRegion === region.name;
            const isHovered = hoveredRegion === region.name;

            // Pulse animation width based on campaign count
            const pulseRadius = stats.total > 0 ? 10 + Math.min(stats.total * 2, 12) : 0;

            return (
              <g 
                key={region.name}
                cursor="pointer"
                onClick={() => onSelectRegion(isSelected ? null : region.name)}
                onMouseEnter={() => setHoveredRegion(region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
              >
                {/* Outer Glow Ring (Pulse) */}
                {stats.total > 0 && (
                  <circle
                    cx={region.x}
                    cy={region.y}
                    r={pulseRadius}
                    fill={region.color}
                    opacity={isHovered || isSelected ? "0.3" : "0.15"}
                    className="animate-pulse"
                    style={{
                      transition: 'all 0.2s ease',
                      transformOrigin: `${region.x}px ${region.y}px`
                    }}
                  />
                )}

                {/* Core interactive dot */}
                <circle
                  cx={region.x}
                  cy={region.y}
                  r={isSelected ? 6 : isHovered ? 5 : 4}
                  fill={isSelected ? 'var(--primary)' : region.color}
                  stroke="white"
                  strokeWidth={isSelected ? 2 : 1.5}
                  style={{
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                  }}
                />

                {/* Text Labels for major regions */}
                {(isSelected || isHovered || region.name === 'Dakar' || region.name === 'Saint-Louis' || region.name === 'Tambacounda' || region.name === 'Ziguinchor') && (
                  <text
                    x={region.x}
                    y={region.y - 10}
                    textAnchor="middle"
                    fill="var(--text-primary-light)"
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: isSelected || isHovered ? 'bold' : 'normal',
                      textShadow: '0px 1px 2px var(--light-card)',
                      transition: 'all 0.2s ease',
                      pointerEvents: 'none'
                    }}
                  >
                    {region.name} {stats.total > 0 && `(${stats.total})`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Custom Premium Tooltip */}
        {hoveredRegion && (() => {
          const stats = getRegionStats(hoveredRegion);
          return (
            <div
              style={{
                position: 'absolute',
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                background: 'rgba(15, 23, 42, 0.95)',
                color: 'white',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                pointerEvents: 'none',
                zIndex: 100,
                minWidth: '150px',
                backdropFilter: 'blur(4px)',
                transition: 'opacity 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📍 {hoveredRegion}</span>
                <span style={{ fontSize: '0.65rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                  {stats.total} Active{stats.total > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)' }}>
                <div>✍️ Pétitions : <strong>{stats.petitions}</strong></div>
                <div>💰 Cagnottes : <strong>{stats.cagnottes}</strong></div>
                <div>🪙 Tontines : <strong>{stats.tontines}</strong></div>
                <div>🛠️ Bénévolat : <strong>{stats.missions}</strong></div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
