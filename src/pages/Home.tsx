import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { MapSenegal } from '../components/MapSenegal';
import { TrustScore } from '../components/TrustScore';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../services/supabaseClient';
import { Turnstile } from '../components/Turnstile';

interface HomeProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { petitions, cagnottes, getKPIs, useSupabase } = useApp();
  const { language, t } = useLanguage();
  const kpis = getKPIs();
  
  useSEO({
    title: 'Mobilisation Citoyenne & Financement Solidaire',
    description: "Rejoignez Sunu Yité, la plateforme d'impact citoyen au Sénégal. Signez des pétitions sécurisées, participez à des cagnottes solidaires transparentes et organisez des tontines de confiance.",
    keywords: 'Sénégal, doléance, pétition, cagnotte, tontine, diaspora, Wave, Orange Money, financement participatif, impact'
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Général',
    message: ''
  });
  
  const activePetitions = petitions.filter(p => p.status === 'active' && (!p.organizer || p.organizer.trustScore > 0));
  const activeCagnottes = cagnottes.filter(c => c.status === 'active' && (!c.organizer || c.organizer.trustScore > 0));

  // Carousel states
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Dynamically build the carousel based on database campaigns
  const carouselItems = React.useMemo(() => {
    const items: { image: string; title: string; desc: string; type: string; id?: string }[] = [];

    // Add active cagnottes
    activeCagnottes.slice(0, 3).forEach(c => {
      items.push({
        image: c.coverImage || '',
        title: `${t('home.cause.cagnotte')} : ${c.title}`,
        desc: c.description.slice(0, 150) + (c.description.length > 150 ? '...' : ''),
        type: 'cagnotte',
        id: c.id
      });
    });

    // Add active petitions
    activePetitions.slice(0, 3).forEach(p => {
      items.push({
        image: p.coverImage || '',
        title: `${t('home.cause.petition')} : ${p.title}`,
        desc: p.description.slice(0, 150) + (p.description.length > 150 ? '...' : ''),
        type: 'petition',
        id: p.id
      });
    });

    // Fallback slide if no launched campaigns are available
    if (items.length === 0) {
      items.push({
        image: '',
        title: 'Sunu Yité : Ensemble pour l\'impact citoyen',
        desc: 'Lancez une cagnotte solidaire transparente ou signez une pétition citoyenne aujourd\'hui pour initier le changement.',
        type: 'explore'
      });
    }

    return items;
  }, [activeCagnottes, activePetitions, t]);

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
            {language === 'wo' ? '🇸🇳 Mbooloo Citoyen ci Senegal' : language === 'en' ? '🇸🇳 Citizen Mobilization in Senegal' : '🇸🇳 Mobilisation Citoyenne au Sénégal'}
          </span>
          <h1 className="hero-title">
            {t('home.welcome')}
          </h1>
          <p className="hero-desc">
            {t('home.tagline')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => onNavigate('explore')}
              style={{ padding: '0.9rem 2rem' }}
            >
              🤝 {t('home.hero.cta1')}
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => onNavigate('create-hub')}
              style={{ padding: '0.9rem 2rem' }}
            >
              ✍️ {t('home.hero.cta2')}
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
            style={
              item.image && item.image.trim() !== '' && !item.image.startsWith('/pub') && item.image !== '/logo.png'
                ? { backgroundImage: `url("${item.image}")` }
                : { 
                    background: item.type === 'petition'
                      ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' // Deep professional blue
                      : item.type === 'cagnotte'
                      ? 'linear-gradient(135deg, #00853f 0%, #005327 100%)' // Rich emerald green
                      : 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' // Slate tech theme
                  }
            }
          >
            <div className="carousel-overlay">
              <h3 className="carousel-title">{item.title}</h3>
              <p className="carousel-desc">{item.desc}</p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (item.type === 'cagnotte' && item.id) {
                    onNavigate('cagnottes', { id: item.id });
                  } else if (item.type === 'petition' && item.id) {
                    onNavigate('petitions', { id: item.id });
                  } else {
                    onNavigate('explore');
                  }
                }}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                {t('home.carousel.join')}
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
          {t('home.stats_title')}
        </h2>
        <div className="grid-cols-4">
          <div className="premium-card hover-scale animate-fade-in delay-1" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>✍️</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.totalSignatures.toLocaleString('fr-FR')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>{t('home.stats.petitions')}</p>
          </div>

          <div className="premium-card hover-scale animate-fade-in delay-2" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>💰</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.totalDonations.toLocaleString('fr-FR')} F
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>{t('home.stats.funds')}</p>
          </div>

          <div className="premium-card hover-scale animate-fade-in delay-3" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>🛠️</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.totalVolunteers.toLocaleString('fr-FR')}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>{t('home.stats.users')}</p>
          </div>

          <div className="premium-card hover-scale animate-fade-in delay-4" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📈</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.5rem' }}>
              {kpis.successRate}%
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)' }}>{t('home.stats.success_rate')}</p>
          </div>
        </div>
      </section>

      {/* Main Map & Interactive Section */}
      <section className="responsive-grid-main-sidebar" style={{ marginBottom: '4rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {t('home.sub.territorial')}
          </h2>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {t('home.desc.territorial')}
          </p>
          <MapSenegal />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {t('home.sub.popular')}
          </h2>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            {t('home.desc.popular')}
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
                      ✍️ {t('home.cause.petition')}
                    </span>
                    <TrustScore score={p.organizer.trustScore} />
                  </div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{p.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span>{p.signaturesCount.toLocaleString('fr-FR')} {t('home.cause.signatures')}</span>
                    <span>{t('home.cause.target')} {p.signaturesTarget.toLocaleString('fr-FR')}</span>
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
                      💰 {t('home.cause.cagnotte')}
                    </span>
                    <TrustScore score={c.organizer.trustScore} />
                  </div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.5rem' }}>{c.title}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                    <span>{c.amountCollected.toLocaleString('fr-FR')} F {t('home.cause.collected')}</span>
                    <span>{t('home.cause.target_amount')} {c.amountTarget.toLocaleString('fr-FR')} F</span>
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
            {t('home.cause.view_all')}
          </button>
        </div>
      </section>

      {/* Module Presentation */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '2.5rem' }}>
          {t('home.tools_title')}
        </h2>
        <div className="grid-cols-3">
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>✍️</span>
            <h3 style={{ fontWeight: 800 }}>{t('home.tools.petitions_title')}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', flex: 1 }}>
              {t('home.tools.petitions_desc')}
            </p>
            <button className="btn btn-ghost" style={{ paddingLeft: 0, justifyContent: 'flex-start' }} onClick={() => onNavigate('petitions')}>
              {t('home.tools.petitions_cta')}
            </button>
          </div>

          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>💰</span>
            <h3 style={{ fontWeight: 800 }}>{t('home.tools.cagnottes_title')}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', flex: 1 }}>
              {t('home.tools.cagnottes_desc')}
            </p>
            <button className="btn btn-ghost" style={{ paddingLeft: 0, justifyContent: 'flex-start' }} onClick={() => onNavigate('cagnottes')}>
              {t('home.tools.cagnottes_cta')}
            </button>
          </div>

          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🌍</span>
            <h3 style={{ fontWeight: 800 }}>{t('home.tools.diaspora_title')}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', flex: 1 }}>
              {t('home.tools.diaspora_desc')}
            </p>
            <button className="btn btn-ghost" style={{ paddingLeft: 0, justifyContent: 'flex-start' }} onClick={() => onNavigate('benevolat')}>
              {t('home.tools.diaspora_cta')}
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem' }}>
          {t('home.testimonials_title')}
        </h2>
        <div className="grid-cols-2" style={{ gap: '2rem' }}>
          <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1.5rem' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary-light)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              {t('home.testimonials.t1')}
            </p>
            <strong>{t('home.testimonials.t1_author')}</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>{t('home.testimonials.t1_role')}</div>
          </div>

          <div style={{ borderLeft: '3px solid var(--secondary)', paddingLeft: '1.5rem' }}>
            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary-light)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              {t('home.testimonials.t2')}
            </p>
            <strong>{t('home.testimonials.t2_author')}</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>{language === 'wo' ? 'Bitim reew (France)' : language === 'en' ? 'Diaspora Member (France)' : 'Membre de la Diaspora (France)'}</div>
          </div>
        </div>
      </section>

      {/* Modern & Animated Contact Form Section */}
      <section id="contact-section" style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: '750px', width: '100%', textAlign: 'center', marginBottom: '2.5rem' }}>
          <span 
            style={{ 
              background: 'rgba(10, 58, 96, 0.1)', 
              color: 'var(--logo-blue, #0A3A60)', 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              padding: '0.35rem 0.8rem', 
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            {t('home.contact.header')}
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.75rem', marginBottom: '0.5rem' }}>
            {t('home.contact.subtitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.95rem' }}>
            {t('home.contact.desc')}
          </p>
        </div>

        <div className="premium-card animate-fade-in" style={{ width: '100%', maxWidth: '650px', padding: '2.5rem 2rem', background: 'var(--light-card)', position: 'relative', overflow: 'hidden', border: '1.5px solid var(--border-light)' }}>
          {formSubmitted ? (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div className="paperplane-icon" style={{ fontSize: '4.5rem', marginBottom: '1rem', display: 'inline-block' }}>
                ✈️
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem' }}>
                {t('home.contact.success')}
              </h3>
              <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
                {t('home.contact.success_desc')}
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setFormSubmitted(false);
                  setContactForm({ name: '', email: '', phone: '', subject: 'Général', message: '' });
                }}
              >
                {t('home.contact.button_another')}
              </button>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!turnstileToken) {
                setFormError("Veuillez valider le Captcha de sécurité.");
                return;
              }
              setFormLoading(true);
              setFormError(null);
              
              let success = true;
              if (useSupabase) {
                try {
                  const { error: err } = await supabase.from('contact_messages').insert([{
                    name: contactForm.name,
                    email: contactForm.email,
                    phone: contactForm.phone,
                    subject: contactForm.subject,
                    message: contactForm.message,
                    recipient: 'admin@sunuyite.com'
                  }]);
                  if (err) {
                    console.error("Erreur lors de l'enregistrement du message de contact dans Supabase :", err);
                    setFormError(t('home.contact.error'));
                    success = false;
                  }
                } catch (err) {
                  console.error("Échec d'envoi du formulaire de contact :", err);
                  setFormError(t('home.contact.error'));
                  success = false;
                }
              } else {
                try {
                  const mockMsgs = JSON.parse(localStorage.getItem('sc_mock_contact_messages') || '[]');
                  mockMsgs.push({
                    id: Math.random().toString(36).substring(2),
                    name: contactForm.name,
                    email: contactForm.email,
                    phone: contactForm.phone,
                    subject: contactForm.subject,
                    message: contactForm.message,
                    recipient: 'admin@sunuyite.com',
                    created_at: new Date().toISOString()
                  });
                  localStorage.setItem('sc_mock_contact_messages', JSON.stringify(mockMsgs));
                } catch (err) {
                  console.error("Erreur de sauvegarde locale du message :", err);
                }
              }

              if (success) {
                try {
                  const mailRes = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: contactForm.name,
                      email: contactForm.email,
                      phone: contactForm.phone,
                      subject: contactForm.subject,
                      message: contactForm.message,
                      turnstileToken
                    })
                  });
                  if (!mailRes.ok) {
                    const mailErrData = await mailRes.json();
                    console.warn("L'envoi de l'e-mail a retourné une erreur (hors DB) :", mailErrData);
                  }
                } catch (mailErr) {
                  console.error("Échec d'appel de l'API d'envoi d'e-mail (hors DB) :", mailErr);
                }
              }

              setFormLoading(false);
              if (success) {
                setFormSubmitted(true);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
                {/* Name field */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-secondary-light)' }}>
                    {t('home.contact.name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Babacar Diop"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--light)',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>

                {/* Email field */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-secondary-light)' }}>
                    {t('home.contact.email_label')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: babacar@gmail.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--light)',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
                {/* Phone field */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-secondary-light)' }}>
                    {t('home.contact.phone_label')}
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: +221 77 123 45 67"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--light)',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>

                {/* Subject Selector */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-secondary-light)' }}>
                    {t('home.contact.subject_label')}
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--light)',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      color: 'var(--text-primary-light)',
                      transition: 'border-color 0.2s ease'
                    }}
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  >
                    <option value="Général">{t('home.contact.subject.general')}</option>
                    <option value="Pétition">{t('home.contact.subject.petition')}</option>
                    <option value="Cagnotte">{t('home.contact.subject.cagnotte')}</option>
                    <option value="Tontine">{t('home.contact.subject.tontine')}</option>
                    <option value="Partenariat">{t('home.contact.subject.partnership')}</option>
                    <option value="Technique">{t('home.contact.subject.technical')}</option>
                  </select>
                </div>
              </div>

              {/* Message field */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem', color: 'var(--text-secondary-light)' }}>
                  {t('home.contact.message_label')}
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder={t('home.contact.message_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--light)',
                    border: '1.5px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                />
              </div>

              {formError && (
                <div style={{
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1.5px solid var(--danger)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {/* Cloudflare Turnstile Verification */}
              <Turnstile 
                onVerify={(token) => setTurnstileToken(token)} 
                onExpire={() => setTurnstileToken(null)}
                onError={() => {
                  setTurnstileToken(null);
                  setFormError("Erreur de validation du Captcha.");
                }}
              />

              {/* Submit button with loading spinner */}
              <button 
                type="submit" 
                className="btn"
                disabled={formLoading || !turnstileToken}
                style={{
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  marginTop: '0.5rem',
                  width: '100%',
                  background: 'var(--logo-blue, #0A3A60)',
                  color: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(10, 58, 96, 0.25)',
                  cursor: formLoading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {formLoading ? (
                  <>
                    <div className="btn-spinner" />
                    <span>{t('home.contact.sending')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('home.contact.send_btn')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
