import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapSenegal } from '../components/MapSenegal';
import { TrustScore } from '../components/TrustScore';

interface HomeProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { petitions, cagnottes, volunteerMissions, getKPIs } = useApp();
  const kpis = getKPIs();
  
  const activePetitions = petitions.filter(p => p.status === 'active');
  const activeCagnottes = cagnottes.filter(c => c.status === 'active');

  // Carousel states
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Dynamically build the carousel based on database campaigns
  const carouselItems = React.useMemo(() => {
    const items: { image: string; title: string; desc: string; type: string; id?: string }[] = [];

    // Add active cagnottes
    activeCagnottes.slice(0, 2).forEach(c => {
      items.push({
        image: c.coverImage || '/pub.png',
        title: `Cagnotte : ${c.title}`,
        desc: c.description.slice(0, 150) + (c.description.length > 150 ? '...' : ''),
        type: 'cagnotte',
        id: c.id
      });
    });

    // Add active petitions
    activePetitions.slice(0, 2).forEach(p => {
      items.push({
        image: p.coverImage || '/pub1.png',
        title: `Pétition : ${p.title}`,
        desc: p.description.slice(0, 150) + (p.description.length > 150 ? '...' : ''),
        type: 'petition',
        id: p.id
      });
    });

    // Default engagement links
    items.push({
      image: '/pub2.png',
      title: 'Diaspora Solidaire : Parrainez un projet communal',
      desc: 'Offrez un avenir meilleur à votre commune d\'origine en parrainant des projets de reboisement et d\'éclairage par Stripe.',
      type: 'diaspora'
    });

    items.push({
      image: '/image_login.png',
      title: 'Engagement Bénévolat : Rejoignez l\'action sur le terrain',
      desc: 'Inscrivez-vous à nos caravanes de sensibilisation sanitaire et nos week-ends d\'action de reboisement de la Grande Muraille Verte.',
      type: 'benevolat'
    });

    return items;
  }, [activeCagnottes, activePetitions]);

  // Auto-play carousel
  React.useEffect(() => {
    if (carouselItems.length === 0) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselItems.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
  };

  // Combine petitions and cagnottes for popular list

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span 
            style={{ 
              background: 'rgba(0,133,63,0.1)', 
              color: 'var(--primary)', 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              padding: '0.35rem 0.8rem', 
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            🇸🇳 Mobilisation Citoyenne au Sénégal
          </span>
          <h1 className="hero-title">
            Chaque citoyen est une <span className="text-gradient">force de changement</span>.
          </h1>
          <p className="hero-desc">
            Lancez des pétitions pour faire entendre votre voix, collectez des fonds de manière transparente via Wave, Orange Money ou Stripe, et engagez des bénévoles pour résoudre les problèmes de votre communauté.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => onNavigate('cagnottes')}
              style={{ padding: '0.9rem 2rem' }}
            >
              🤝 Soutenir un projet
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => onNavigate('petitions')}
              style={{ padding: '0.9rem 2rem' }}
            >
              ✍️ Signer une pétition
            </button>
          </div>
        </div>
      </section>

      {/* Premium Sliding Campaign Carousel */}
      <section className="carousel-container animate-fade-in delay-1">
        {carouselItems.map((item, idx) => (
          <div 
            key={idx}
            className={`carousel-slide ${idx === carouselIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${item.image})` }}
          >
            <div className="carousel-overlay">
              <h3 className="carousel-title">{item.title}</h3>
              <p className="carousel-desc">{item.desc}</p>
              <button 
                className="btn btn-primary"
                onClick={() => onNavigate('explore')}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Rejoindre la cause ➔
              </button>
            </div>
          </div>
        ))}

        {/* Carousel arrows */}
        <div className="carousel-arrows">
          <button className="carousel-arrow" onClick={handlePrev}>
            ◀
          </button>
          <button className="carousel-arrow" onClick={handleNext}>
            ▶
          </button>
        </div>

        {/* Carousel indicator dots */}
        <div className="carousel-dots">
          {carouselItems.map((_, idx) => (
            <span 
              key={idx}
              className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
              onClick={() => setCarouselIndex(idx)}
            />
          ))}
        </div>
      </section>

      {/* Dynamic Statistics Grid */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>
          La force du collectif en chiffres
        </h2>
        <div className="grid-cols-4">
          <div className="premium-card hover-scale animate-fade-in delay-1" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>✍️</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.totalSignatures.toLocaleString('fr-FR')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>Signatures de Pétitions</p>
          </div>

          <div className="premium-card hover-scale animate-fade-in delay-2" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>💰</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.totalDonations.toLocaleString('fr-FR')} F
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>Fonds Collectés (FCFA)</p>
          </div>

          <div className="premium-card hover-scale animate-fade-in delay-3" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🛠️</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.totalVolunteers.toLocaleString('fr-FR')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>Bénévoles Engagés</p>
          </div>

          <div className="premium-card hover-scale animate-fade-in delay-4" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📈</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.successRate}%
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>Taux de Réussite</p>
          </div>
        </div>
      </section>

      {/* Main Map & Interactive Section */}
      <section className="responsive-grid-main-sidebar" style={{ marginBottom: '4rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Impact Territorial
          </h2>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Visualisez les causes actives et les fonds mobilisés dans chaque département et région du Sénégal.
          </p>
          <MapSenegal />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Causes Populaires
          </h2>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Soutenez les mobilisations citoyennes les plus actives du moment.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top Petition */}
            {activePetitions.slice(0, 1).map((p) => {
              const pct = Math.min(100, Math.round((p.signaturesCount / p.signaturesTarget) * 100));
              return (
                <div 
                  key={p.id} 
                  className="premium-card" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('petitions', { id: p.id })}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      ✍️ PÉTITION
                    </span>
                    <TrustScore score={p.organizer.trustScore} />
                  </div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{p.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span>{p.signaturesCount.toLocaleString('fr-FR')} signatures</span>
                    <span>Objectif : {p.signaturesTarget.toLocaleString('fr-FR')}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}

            {/* Top Cagnotte */}
            {activeCagnottes.slice(0, 1).map((c) => {
              const pct = Math.min(100, Math.round((c.amountCollected / c.amountTarget) * 100));
              return (
                <div 
                  key={c.id} 
                  className="premium-card" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNavigate('cagnottes', { id: c.id })}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(252,209,22,0.15)', color: 'var(--secondary-dark)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      💰 CAGNOTTE
                    </span>
                    <TrustScore score={c.organizer.trustScore} />
                  </div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{c.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span>{c.amountCollected.toLocaleString('fr-FR')} F récoltés</span>
                    <span>Cible : {c.amountTarget.toLocaleString('fr-FR')} F</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--secondary)', borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => onNavigate('explore')}
          >
            Découvrir toutes les causes ➔
          </button>
        </div>
      </section>

      {/* Module Presentation */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '2.5rem' }}>
          Une boîte à outils complète pour l'impact social
        </h2>
        <div className="grid-cols-3">
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>✍️</span>
            <h3 style={{ fontWeight: 800 }}>Pétitions Citoyennes</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', flex: 1 }}>
              Proposez des changements législatifs, des arrêtés locaux ou dénoncez des injustices. Collectez des signatures validées par OTP SMS pour asseoir votre légitimité auprès des décideurs.
            </p>
            <button className="btn btn-ghost" style={{ paddingLeft: 0, justifyContent: 'flex-start' }} onClick={() => onNavigate('petitions')}>
              Lancer une pétition ➔
            </button>
          </div>

          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>💰</span>
            <h3 style={{ fontWeight: 800 }}>Cagnottes Transparentes</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', flex: 1 }}>
              Financez des forages, des réhabilitations d'écoles, ou des secours d'urgence. Bénéficiez du suivi des dépenses en temps réel et de factures téléchargeables pour garantir une transparence totale.
            </p>
            <button className="btn btn-ghost" style={{ paddingLeft: 0, justifyContent: 'flex-start' }} onClick={() => onNavigate('cagnottes')}>
              Créer une cagnotte ➔
            </button>
          </div>

          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🌍</span>
            <h3 style={{ fontWeight: 800 }}>Diaspora & Bénévolat</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', flex: 1 }}>
              Permettez aux Sénégalais de l'étranger de parrainer leur village natal par Stripe, et offrez aux citoyens locaux de s'engager physiquement dans des missions de reboisement ou de soutien scolaire.
            </p>
            <button className="btn btn-ghost" style={{ paddingLeft: 0, justifyContent: 'flex-start' }} onClick={() => onNavigate('benevolat')}>
              Trouver une mission ➔
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>
          Ils font bouger le Sénégal
        </h2>
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1.5rem' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary-light)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              "Grâce à Sama Cause, nous avons collecté 4,5 millions FCFA en 12 jours pour équiper le forage solaire de Barkedji. L'onglet Transparence nous a permis de publier chaque facture d'achat de tuyaux, rassurant ainsi nos donateurs de la diaspora."
            </p>
            <strong>Amady Ndiaye</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Président de l'association Horizon Louga</div>
          </div>

          <div style={{ borderLeft: '3px solid var(--secondary)', paddingLeft: '1.5rem' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary-light)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              "J'habite à Lyon et je cherchais un moyen fiable d'aider l'école de mon village. Avec la cagnotte Sama Cause et le score de confiance vérifié, j'ai fait un don par carte bancaire. J'ai pu suivre l'avancée des travaux photo par photo."
            </p>
            <strong>Moussa Diagne</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Membre de la Diaspora (France)</div>
          </div>
        </div>
      </section>
    </div>
  );
};
