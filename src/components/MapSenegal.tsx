import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface RegionData {
  id: string;
  name: string;
  petitions: number;
  fundsCollected: number; // in FCFA
  volunteers: number;
  pathData: string; // SVG path representation
  centerX: number; // label positions
  centerY: number;
}

// Stylized premium vector data for the 14 regions of Senegal
const regions: RegionData[] = [
  {
    id: 'dakar',
    name: 'Dakar',
    petitions: 12,
    fundsCollected: 14500000,
    volunteers: 180,
    pathData: 'M 35 155 L 45 150 L 50 160 L 40 170 Z',
    centerX: 28,
    centerY: 165
  },
  {
    id: 'thies',
    name: 'Thiès',
    petitions: 8,
    fundsCollected: 7800000,
    volunteers: 95,
    pathData: 'M 45 150 L 75 140 L 70 180 L 50 160 Z',
    centerX: 62,
    centerY: 162
  },
  {
    id: 'saint-louis',
    name: 'Saint-Louis',
    petitions: 6,
    fundsCollected: 3100000,
    volunteers: 50,
    pathData: 'M 75 140 L 140 110 L 190 90 L 170 120 L 120 135 L 75 140 Z',
    centerX: 120,
    centerY: 115
  },
  {
    id: 'louga',
    name: 'Louga',
    petitions: 15,
    fundsCollected: 11050000,
    volunteers: 140,
    pathData: 'M 75 140 L 120 135 L 170 120 L 160 160 L 115 190 L 70 180 Z',
    centerX: 110,
    centerY: 160
  },
  {
    id: 'diourbel',
    name: 'Diourbel',
    petitions: 4,
    fundsCollected: 2300000,
    volunteers: 35,
    pathData: 'M 70 180 L 115 190 L 105 215 L 72 205 Z',
    centerX: 90,
    centerY: 198
  },
  {
    id: 'fatick',
    name: 'Fatick',
    petitions: 3,
    fundsCollected: 1800000,
    volunteers: 25,
    pathData: 'M 72 205 L 105 215 L 100 240 L 60 240 L 55 220 Z',
    centerX: 75,
    centerY: 228
  },
  {
    id: 'kaolack',
    name: 'Kaolack',
    petitions: 5,
    fundsCollected: 3900000,
    volunteers: 60,
    pathData: 'M 105 215 L 165 210 L 160 250 L 100 240 Z',
    centerX: 130,
    centerY: 230
  },
  {
    id: 'kaffrine',
    name: 'Kaffrine',
    petitions: 3,
    fundsCollected: 1400000,
    volunteers: 30,
    pathData: 'M 115 190 L 160 160 L 210 185 L 205 235 L 165 210 Z',
    centerX: 175,
    centerY: 200
  },
  {
    id: 'matam',
    name: 'Matam',
    petitions: 7,
    fundsCollected: 8900000,
    volunteers: 110,
    pathData: 'M 190 90 L 260 110 L 290 170 L 245 190 L 210 185 L 170 120 Z',
    centerX: 230,
    centerY: 140
  },
  {
    id: 'tambacounda',
    name: 'Tambacounda',
    petitions: 9,
    fundsCollected: 6400000,
    volunteers: 120,
    pathData: 'M 210 185 L 245 190 L 290 170 L 330 220 L 310 320 L 240 315 L 220 270 L 205 235 Z',
    centerX: 265,
    centerY: 250
  },
  {
    id: 'kedougou',
    name: 'Kédougou',
    petitions: 4,
    fundsCollected: 4500000,
    volunteers: 75,
    pathData: 'M 310 320 L 350 310 L 340 365 L 285 360 L 285 330 Z',
    centerX: 315,
    centerY: 340
  },
  {
    id: 'kolda',
    name: 'Kolda',
    petitions: 8,
    fundsCollected: 5200000,
    volunteers: 80,
    pathData: 'M 160 285 L 220 270 L 240 315 L 285 330 L 285 360 L 225 355 L 175 320 Z',
    centerX: 215,
    centerY: 320
  },
  {
    id: 'sedhiou',
    name: 'Sédhiou',
    petitions: 2,
    fundsCollected: 950000,
    volunteers: 20,
    pathData: 'M 105 295 L 160 285 L 175 320 L 125 330 Z',
    centerX: 140,
    centerY: 310
  },
  {
    id: 'ziguinchor',
    name: 'Ziguinchor',
    petitions: 6,
    fundsCollected: 4100000,
    volunteers: 90,
    pathData: 'M 60 295 L 105 295 L 125 330 L 65 320 Z',
    centerX: 95,
    centerY: 310
  }
];

export const MapSenegal: React.FC = () => {
  const { petitions, cagnottes, volunteerMissions, usersList } = useApp();
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Dynamically calculate statistics from local context to override mock values
  const getRegionStats = (regionName: string) => {
    const regLower = regionName.toLowerCase();
    const activePetitions = petitions.filter(p => p.location.toLowerCase() === regLower && p.status === 'active').length;
    const funds = cagnottes
      .filter(c => c.location.toLowerCase() === regLower && c.status === 'active')
      .reduce((sum, c) => sum + c.amountCollected, 0);
    
    // Count volunteers from mission signups + users who reside in this region
    const missionVols = volunteerMissions
      .filter(m => m.location.toLowerCase() === regLower && m.status === 'active')
      .reduce((sum, m) => sum + m.volunteersCount, 0);
    const registeredVols = usersList.filter(u => u.region?.toLowerCase() === regLower).length;
    const vols = missionVols + registeredVols;

    return {
      petitions: activePetitions,
      fundsCollected: funds,
      volunteers: vols
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="map-container" onMouseMove={handleMouseMove}>
        {/* SVG Viewport configured to wrap the coordinates */}
        <svg viewBox="0 0 380 400" className="senegal-map-svg">
          {/* Graticules grid background for tech premium look */}
          <g stroke="var(--border-light)" strokeWidth="0.5" opacity="0.3">
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`x-${i}`} x1={0} y1={i * 40} x2={380} y2={i * 40} />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`y-${i}`} x1={i * 38} y1={0} x2={i * 38} y2={400} />
            ))}
          </g>

          {/* Gamble/Gambia placeholder (river cutting Casamance) */}
          <path 
            d="M 60 255 L 160 265 L 220 270" 
            stroke="var(--border-light)" 
            strokeWidth="8" 
            fill="none" 
            opacity="0.15" 
            strokeLinecap="round"
          />

          {regions.map((region) => {
            const isHovered = hoveredRegion?.id === region.id;
            const isSelected = selectedRegion?.id === region.id;
            const stats = getRegionStats(region.name);
            const hasActivity = stats.petitions > 0 || stats.fundsCollected > 0 || stats.volunteers > 0;
            const regLower = region.name.toLowerCase();
            const hasBoosted = petitions.some(p => p.location.toLowerCase() === regLower && p.status === 'active' && p.boosted);

            return (
              <g key={region.id}>
                <path
                  d={region.pathData}
                  className={`map-region-path ${isSelected ? 'active' : ''} ${hasActivity ? 'highlighted' : ''}`}
                  onMouseEnter={() => setHoveredRegion(region)}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onClick={() => setSelectedRegion(region)}
                />
                <text
                  x={region.centerX}
                  y={region.centerY}
                  fill={isHovered || isSelected ? 'var(--primary)' : 'var(--text-secondary-light)'}
                  fontSize="7.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ pointerEvents: 'none', transition: 'var(--transition-fast)' }}
                >
                  {region.name}
                </text>
                {hasBoosted && (
                  <circle
                    cx={region.centerX + 15}
                    cy={region.centerY - 5}
                    className="map-boost-dot"
                  >
                    <title>Campagne Boostée en Cours</title>
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredRegion && (
          <div 
            className="map-tooltip" 
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.35rem', fontWeight: 800 }}>
              🇸🇳 {hoveredRegion.name}
            </h4>
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div>✍️ Pétitions : <strong>{getRegionStats(hoveredRegion.name).petitions} active(s)</strong></div>
              <div>💰 Collecté : <strong>{getRegionStats(hoveredRegion.name).fundsCollected.toLocaleString('fr-FR')} FCFA</strong></div>
              <div>🛠️ Bénévoles : <strong>{getRegionStats(hoveredRegion.name).volunteers} actifs</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Detail panel of selected region */}
      <div 
        className="premium-card" 
        style={{ 
          background: 'var(--glass-bg)', 
          borderColor: 'var(--glass-border)', 
          opacity: selectedRegion ? 1 : 0.8 
        }}
      >
        {selectedRegion ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                Région de {selectedRegion.name}
              </h3>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                onClick={() => setSelectedRegion(null)}
              >
                Tout réinitialiser
              </button>
            </div>
            <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
              <div className="premium-card" style={{ textAlign: 'center', background: 'var(--light)' }}>
                <span style={{ fontSize: '1.75rem' }}>✍️</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
                  {getRegionStats(selectedRegion.name).petitions}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Pétitions Actives</p>
              </div>
              <div className="premium-card" style={{ textAlign: 'center', background: 'var(--light)' }}>
                <span style={{ fontSize: '1.75rem' }}>💰</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
                  {getRegionStats(selectedRegion.name).fundsCollected.toLocaleString('fr-FR')} FCFA
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Fonds Récoltés</p>
              </div>
              <div className="premium-card" style={{ textAlign: 'center', background: 'var(--light)' }}>
                <span style={{ fontSize: '1.75rem' }}>🛠️</span>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
                  {getRegionStats(selectedRegion.name).volunteers}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Missions Bénévoles</p>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>
              Cliquez sur d'autres régions de la carte interactive pour suivre l'impact en temps réel des mobilisations citoyennes locales à travers le Sénégal.
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ fontWeight: 600 }}>Cliquez sur une région du Sénégal sur la carte ci-dessus pour afficher l'impact local.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
              Les régions affichées en nuance dorée présentent des actions ou collectes en cours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
