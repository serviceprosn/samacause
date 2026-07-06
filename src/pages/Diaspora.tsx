import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { TrustScore } from '../components/TrustScore';

interface DiasporaProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Diaspora: React.FC<DiasporaProps> = ({ onNavigate }) => {
  const { cagnottes } = useApp();
  const { t } = useLanguage();
  
  const [eurInput, setEurInput] = useState('100');
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR');
  
  const [totalMobilized, setTotalMobilized] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const [donorsCount, setDonorsCount] = useState(0);
  const [feesSaved, setFeesSaved] = useState(0);

  React.useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const intervalTime = duration / steps;
    
    const targets = {
      mobilized: 45890000,
      projects: 24,
      donors: 1430,
      fees: 4589000
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setTotalMobilized(Math.round(targets.mobilized * progress));
      setProjectsCount(Math.round(targets.projects * progress));
      setDonorsCount(Math.round(targets.donors * progress));
      setFeesSaved(Math.round(targets.fees * progress));

      if (step >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Convert
  const rate = currency === 'EUR' ? 655.957 : 605.5; // conversion rates
  const fcfaValue = eurInput ? Math.round(parseFloat(eurInput) * rate) : 0;

  // Filter cagnottes targeted for Diaspora
  const diasporaProjects = cagnottes.filter(c => c.isDiasporaTargeted && c.status === 'active');

  const completedProjects = cagnottes.filter(c => c.status === 'completed' && c.isDiasporaTargeted);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Hero section */}
      <section 
        style={{
          background: 'linear-gradient(135deg, #1e3b8a 0%, var(--primary-dark) 100%)',
          color: 'white',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '3rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ maxWidth: '750px' }}>
          <span style={{ background: 'var(--secondary)', color: 'black', fontWeight: 'bold', fontSize: '0.75rem', padding: '0.3rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {t('diaspora.badge')}
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '1rem', marginBottom: '1rem', color: '#fff' }}>
            {t('diaspora.hero.title')}
          </h1>
          <p style={{ fontSize: '1rem', opacity: 0.9, lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {t('diaspora.hero.desc')}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{t('diaspora.badge.secure')}</span>
            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{t('diaspora.badge.receipts')}</span>
            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.15)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{t('diaspora.badge.stripe')}</span>
          </div>
        </div>
      </section>

      {/* DIASPORA IMPACT DASHBOARD */}
      <section 
        className="premium-card animate-slide-up" 
        style={{ 
          marginBottom: '3rem', 
          background: 'rgba(10, 25, 47, 0.4)',
          border: '1.5px solid var(--border-light)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📈 Impact du Co-développement Diaspora
        </h2>
        
        {/* Metric Grid */}
        <div className="grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="premium-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', textAlign: 'center', padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🌍</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--primary)', margin: '0.5rem 0' }}>
              {totalMobilized.toLocaleString('fr-FR')} F
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Total Mobilisé</p>
          </div>

          <div className="premium-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', textAlign: 'center', padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🏗️</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#10B981', margin: '0.5rem 0' }}>
              {projectsCount} Projets
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Réalisations Financées</p>
          </div>

          <div className="premium-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', textAlign: 'center', padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🤝</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--secondary-dark)', margin: '0.5rem 0' }}>
              {donorsCount} Donateurs
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Citoyens Actifs</p>
          </div>

          <div className="premium-card" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', textAlign: 'center', padding: '1.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🛡️</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#8B5CF6', margin: '0.5rem 0' }}>
              {feesSaved.toLocaleString('fr-FR')} F
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Frais Économisés (0%)</p>
          </div>
        </div>

        {/* Breakdown & Transparency info */}
        <div className="grid-cols-2" style={{ gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 750, marginBottom: '1rem' }}>
              🌍 Provenance Géographique des Dons
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { country: 'France 🇫🇷', percent: 45, color: 'var(--primary)' },
                { country: 'États-Unis 🇺🇸', percent: 25, color: '#10B981' },
                { country: 'Italie 🇮🇹', percent: 15, color: 'var(--secondary-dark)' },
                { country: 'Espagne 🇪🇸', percent: 10, color: '#F59E0B' },
                { country: 'Autres 🌐', percent: 5, color: '#8B5CF6' }
              ].map((item) => (
                <div key={item.country}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                    <span>{item.country}</span>
                    <strong>{item.percent}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${item.percent}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 242, 254, 0.03)', border: '1px dashed rgba(0, 242, 254, 0.25)', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 750, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>🔒</span> Traçabilité Blockchain & Preuves Réelles
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary-light)', lineHeight: 1.45 }}>
              Chaque don est inscrit de manière inaltérable. Sunu Yité exige des porteurs de projets la mise à disposition de factures signées par les commerçants locaux, de coordonnées GPS exactes, et de vidéos de livraison. 
              <br/><br/>
              <strong>La confiance de la diaspora est au cœur de notre modèle de co-développement.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Converter Panel & Explainer */}
      <section className="grid-cols-2" style={{ gap: '2.5rem', marginBottom: '4rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            {t('diaspora.converter.title')}
          </h2>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {t('diaspora.converter.desc')}
          </p>

          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--light-card)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                className="premium-card"
                style={{ flex: 2, padding: '0.75rem', background: 'var(--light)' }}
                value={eurInput}
                onChange={(e) => setEurInput(e.target.value)}
              />
              <select 
                className="premium-card"
                style={{ flex: 1, padding: '0.75rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
                value={currency}
                onChange={(e: any) => setCurrency(e.target.value)}
              >
                <option value="EUR">{t('diaspora.converter.eur')}</option>
                <option value="USD">{t('diaspora.converter.usd')}</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{t('diaspora.converter.local_val')}</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                  {fcfaValue.toLocaleString('fr-FR')} FCFA
                </h3>
              </div>
              <span style={{ fontSize: '2rem' }}>🇸🇳</span>
            </div>
            
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>
              {t('diaspora.converter.disclaimer')}
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>
            {t('diaspora.why.title')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '1.75rem' }}>💳</span>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{t('diaspora.why.card_title')}</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginTop: '0.15rem' }}>
                  {t('diaspora.why.card_desc')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '1.75rem' }}>📍</span>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{t('diaspora.why.track_title')}</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginTop: '0.15rem' }}>
                  {t('diaspora.why.track_desc')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🛡️</span>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{t('diaspora.why.trust_title')}</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginTop: '0.15rem' }}>
                  {t('diaspora.why.trust_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Diaspora Projects */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          {t('diaspora.active.title')}
        </h2>

        {diasporaProjects.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', fontStyle: 'italic' }}>
            {t('diaspora.active.none')}
          </p>
        ) : (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            {diasporaProjects.map((cag) => {
              const pct = Math.min(100, Math.round((cag.amountCollected / cag.amountTarget) * 100));
              return (
                <div key={cag.id} className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div 
                    style={{ 
                      height: '180px', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundImage: `url("${cag.coverImage}")`, 
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      marginBottom: '1rem'
                    }} 
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--secondary-dark)', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(252,209,22,0.15)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {cag.category}
                        </span>
                        <TrustScore score={cag.organizer.trustScore} />
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem' }}>{cag.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: '0.25rem' }}>
                        {cag.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span><strong>{cag.amountCollected.toLocaleString('fr-FR')} F</strong> {t('home.cause.collected')}</span>
                        <span>{t('home.cause.target_amount')} {cag.amountTarget.toLocaleString('fr-FR')} F</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #1e3b8a 0%, var(--primary) 100%)', borderRadius: '4px' }} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          {t('diaspora.active.location')} <strong>{cag.location}</strong>
                        </span>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                          onClick={() => onNavigate('cagnottes', { id: cag.id })}
                        >
                          {t('diaspora.active.donate')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Diaspora Projects Showcase */}
      <section>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem' }}>
          {t('diaspora.completed.title')}
        </h2>
        {completedProjects.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', fontStyle: 'italic', padding: '1.5rem', background: 'var(--light-card)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            {t('diaspora.completed.none')}
          </p>
        ) : (
          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            {completedProjects.map((p) => {
              const totalDiasporaDonations = p.donors
                .filter(d => d.isDiaspora)
                .reduce((sum, d) => sum + d.amount, 0);
              const diasporaPercent = p.amountCollected > 0 
                ? Math.round((totalDiasporaDonations / p.amountCollected) * 100) 
                : 100;
              return (
                <div key={p.id} className="premium-card">
                  <div 
                    style={{ 
                      height: '160px', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundImage: `url("${p.coverImage}")`, 
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      marginBottom: '1rem',
                      position: 'relative'
                    }} 
                  >
                    <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {t('diaspora.completed.badge_prefix')}{diasporaPercent}{t('diaspora.completed.badge_suffix')}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: 1.4, marginBottom: '0.75rem' }}>{p.description}</p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                    {t('diaspora.completed.budget')}{p.amountCollected.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
