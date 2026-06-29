import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Petition, Cagnotte, VolunteerMission } from '../types';
import { TrustScore } from '../components/TrustScore';

interface ExplorerProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Explorer: React.FC<ExplorerProps> = ({ onNavigate }) => {
  const { petitions, cagnottes, volunteerMissions, tontines } = useApp();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'petition' | 'cagnotte' | 'tontine' | 'benevolat'>('all');

  // Filter lists
  const activePetitions = petitions.filter(p => p.status === 'active');
  const activeCagnottes = cagnottes.filter(c => c.status === 'active');
  const activeMissions = volunteerMissions.filter(m => m.status === 'active');
  const activeTontines = tontines.filter(t => t.type !== 'private' && (t.status === 'active' || t.status === 'recruiting' || !t.status));

  // Combine items for unified list
  const allItems = [
    ...activePetitions.map(p => ({ ...p, type: 'petition' as const, dateValue: p.createdAt })),
    ...activeCagnottes.map(c => ({ ...c, type: 'cagnotte' as const, dateValue: c.createdAt })),
    ...activeMissions.map(m => ({ ...m, type: 'benevolat' as const, dateValue: m.createdAt })),
    ...activeTontines.map(t => ({ 
      ...t, 
      type: 'tontine' as const, 
      title: t.name, 
      description: t.description || `Cercle d'épargne solidaire. Cotisation de ${t.cotisation.toLocaleString('fr-FR')} F par personne.`,
      coverImage: '/pub2.png',
      location: t.type === 'public' ? 'Sénégal (National)' : 'Privé / Sur invitation',
      dateValue: t.startDate || new Date().toISOString()
    }))
  ].sort((a, b) => new Date(b.dateValue).getTime() - new Date(a.dateValue).getTime());

  // Apply search & tab filters
  const filteredItems = allItems.filter(item => {
    const matchesTab = activeTab === 'all' || item.type === activeTab;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesTab && matchesSearch;
  });

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
          {t('explore.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Découvrez, signez, financez et engagez-vous dans les initiatives de la communauté.
        </p>
      </div>

      {/* Unified Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <input
          type="text"
          className="premium-card"
          placeholder={t('explore.search_placeholder')}
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 2.75rem',
            fontSize: '0.95rem',
            background: 'var(--light-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary-light)'
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span 
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.1rem',
            color: 'var(--text-secondary-light)'
          }}
        >
          🔍
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary-light)',
              fontSize: '0.9rem'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation tabs for mobile-friendly navigation */}
      <div 
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        {[
          { id: 'all', label: t('explore.tabs.all'), icon: '🌍' },
          { id: 'petition', label: t('explore.tabs.petitions'), icon: '✍️' },
          { id: 'cagnotte', label: t('explore.tabs.cagnottes'), icon: '💰' },
          { id: 'tontine', label: t('explore.tabs.tontines'), icon: '🪙' },
          { id: 'benevolat', label: t('explore.tabs.benevolat'), icon: '🛠️' }
        ].map((tab) => (
          <button
            key={tab.id}
            className="btn"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.8rem',
              borderRadius: '9999px',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: activeTab === tab.id ? 'var(--primary)' : 'var(--light-card)',
              color: activeTab === tab.id ? 'white' : 'var(--text-primary-light)',
              border: `1px solid ${activeTab === tab.id ? 'var(--primary)' : 'var(--border-light)'}`
            }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Grid listing */}
      {filteredItems.length === 0 ? (
        <div 
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--light-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-light)'
          }}
        >
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📭</span>
          <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Aucune cause trouvée</h3>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Essayez de modifier votre recherche ou filtrez par une autre catégorie.
          </p>
        </div>
      ) : (
        <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
          {filteredItems.map((item: any) => {
            let badgeText = '';
            let badgeBg = '';
            let badgeColor = '';
            let footerLeft = '';
            let actionText = '';
            let actionPage = '';
            let actionParams: any = { id: item.id };
            let progressPct = 0;

            if (item.type === 'petition') {
              badgeText = `✍️ ${t('explore.tabs.petitions')}`;
              badgeBg = 'rgba(0, 133, 63, 0.1)';
              badgeColor = 'var(--primary)';
              progressPct = Math.min(100, Math.round((item.signaturesCount / item.signaturesTarget) * 100));
              footerLeft = `${item.signaturesCount.toLocaleString('fr-FR')} signatures / Cible ${item.signaturesTarget.toLocaleString('fr-FR')}`;
              actionText = t('btn.sign');
              actionPage = 'petitions';
            } else if (item.type === 'cagnotte') {
              badgeText = `💰 ${t('explore.tabs.cagnottes')}`;
              badgeBg = 'rgba(252, 209, 22, 0.15)';
              badgeColor = 'var(--secondary-dark)';
              progressPct = Math.min(100, Math.round((item.amountCollected / item.amountTarget) * 100));
              footerLeft = `${item.amountCollected.toLocaleString('fr-FR')} F / Cible ${item.amountTarget.toLocaleString('fr-FR')} F`;
              actionText = t('btn.donate');
              actionPage = 'cagnottes';
            } else if (item.type === 'benevolat') {
              badgeText = `🛠️ ${t('explore.tabs.benevolat')}`;
              badgeBg = 'rgba(59, 130, 246, 0.1)';
              badgeColor = '#3b82f6';
              progressPct = Math.min(100, Math.round((item.volunteersCount / item.volunteersTarget) * 100));
              footerLeft = `${item.volunteersCount} bénévoles / Objectif ${item.volunteersTarget}`;
              actionText = t('btn.apply');
              actionPage = 'benevolat';
            } else if (item.type === 'tontine') {
              badgeText = `🪙 ${t('explore.tabs.tontines')}`;
              badgeBg = 'rgba(139, 92, 246, 0.1)';
              badgeColor = '#8b5cf6';
              footerLeft = `Cotisation : ${item.cotisation.toLocaleString('fr-FR')} F • ${item.frequency === 'daily' ? 'Journalière' : item.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuelle'}`;
              actionText = t('btn.apply'); // Use general apply button
              actionPage = 'tontines';
              actionParams = null; // direct page navigation
            }

            return (
              <div 
                key={`${item.type}_${item.id}`} 
                className="premium-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div>
                  {/* Cover Image */}
                  {item.coverImage && (
                    <div 
                      style={{ 
                        height: '160px', 
                        borderRadius: 'var(--radius-md)', 
                        backgroundImage: `url("${item.coverImage}")`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        marginBottom: '1rem',
                        position: 'relative'
                      }} 
                    />
                  )}

                  {/* Top Badge and Trust Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 'bold', 
                        background: badgeBg, 
                        color: badgeColor, 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {badgeText}
                    </span>
                    {item.organizer && item.organizer.trustScore !== undefined && (
                      <TrustScore score={item.organizer.trustScore} />
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 
                    style={{ fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', lineHeight: 1.3 }}
                    onClick={() => onNavigate(actionPage, actionParams)}
                  >
                    {item.title}
                  </h3>
                  
                  <p 
                    style={{ 
                      fontSize: '0.825rem', 
                      color: 'var(--text-secondary-light)', 
                      marginTop: '0.4rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Progress Indicators and Footer */}
                <div style={{ marginTop: '1.25rem' }}>
                  {item.type !== 'tontine' && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-primary-light)' }}>{footerLeft}</span>
                        <span style={{ color: badgeColor }}>{progressPct}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', background: badgeColor, borderRadius: '3px' }} />
                      </div>
                    </div>
                  )}

                  {item.type === 'tontine' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginBottom: '0.75rem', fontWeight: 600 }}>
                      {footerLeft}
                    </div>
                  )}

                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '0.75rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    <span style={{ color: 'var(--text-secondary-light)' }}>
                      📍 <strong>{item.location || 'Sénégal'}</strong>
                    </span>
                    <button
                      className="btn btn-primary"
                      style={{ 
                        padding: '0.45rem 0.85rem', 
                        fontSize: '0.75rem',
                        background: badgeColor,
                        borderColor: badgeColor,
                        color: 'white'
                      }}
                      onClick={() => onNavigate(actionPage, actionParams)}
                    >
                      {actionText} ➔
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
