import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { TrustScore } from './TrustScore';
import { VerifiedBadge } from './VerifiedBadge';
import { supabase } from '../services/supabaseClient';

interface PublicProfileModalProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ onNavigate }) => {
  const {
    selectedPublicUserId,
    setSelectedPublicUserId,
    usersList,
    petitions,
    cagnottes,
    setActiveChatUserId,
    currentUser,
    followUser,
    unfollowUser,
    isMobileView
  } = useApp();
  const { t } = useLanguage();

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  if (!selectedPublicUserId) return null;

  const user = usersList.find(u => u.id === selectedPublicUserId);
  if (!user) return null;

  const handleSendReport = async () => {
    if (!reportReason) {
      alert("Veuillez sélectionner un motif de signalement.");
      return;
    }

    try {
      const finalReason = reportDetails.trim() 
        ? `${reportReason} - Détails : ${reportDetails.trim()}`
        : reportReason;

      const reportMsg = `[REPORT] ReporterID:${currentUser?.id};ReportedID:${user.id};ReportedName:${user.name};Reason:${finalReason}`;
      
      const { error } = await supabase.from('contact_messages').insert([{
        name: currentUser?.name || 'Anonyme',
        email: currentUser?.email || 'anonyme@sunuyite.com',
        phone: currentUser?.phone || '',
        message: reportMsg
      }]);

      if (error) {
        console.error("Error sending report:", error.message);
        alert("Une erreur est survenue lors de l'envoi du signalement. Réessayez.");
      } else {
        alert("🚨 Signalement envoyé avec succès ! L'administration va procéder à la vérification.");
        setShowReportForm(false);
        setReportReason('');
        setReportDetails('');
      }
    } catch (err: any) {
      console.error(err);
      alert("Erreur de connexion.");
    }
  };

  const isSelf = currentUser && currentUser.id === user.id;
  const isFollowing = currentUser?.following?.includes(user.id);
  const isFollower = currentUser?.followers?.includes(user.id);
  const canContact = isFollowing || isFollower;

  // Calculate stats
  const organizedPetitions = petitions.filter(p => p.organizer?.id === user.id && p.status === 'active');
  const organizedCagnottes = cagnottes.filter(c => c.organizer?.id === user.id && c.status === 'active');
  
  const signedPetitionsCount = petitions.filter(p =>
    p.signers.some(s => (s.name || '').toLowerCase() === (user.name || '').toLowerCase())
  ).length;

  const donationsCount = cagnottes.reduce((sum, c) => {
    const match = c.donors.filter(d => (d.name || '').toLowerCase() === (user.name || '').toLowerCase());
    return sum + match.length;
  }, 0);

  const tontinesList = JSON.parse(localStorage.getItem('sc_tontines_list') || '[]');
  const tontinesCount = tontinesList.filter((t: any) =>
    t.members && t.members.some((m: any) => {
      const mName = typeof m === 'string' ? m : m?.name;
      const mEmail = typeof m === 'string' ? '' : m?.email;
      const userNameLower = (user.name || '').toLowerCase();
      const userEmailLower = (user.email || '').toLowerCase();
      const mNameLower = (mName || '').toLowerCase();
      const mEmailLower = (mEmail || '').toLowerCase();
      return (mNameLower === userNameLower) || (userEmailLower && mEmailLower === userEmailLower);
    })
  ).length;

  const getAccountTypeBadge = () => {
    switch (user.accountType) {
      case 'ngo':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '12px', background: 'rgba(0, 133, 63, 0.1)', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid rgba(0, 133, 63, 0.2)' }}>
            🤝 ONG
          </span>
        );
      case 'company':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.1)', color: 'var(--dark)', fontWeight: 'bold', border: '1px solid rgba(30, 41, 59, 0.2)' }}>
            🏢 Entreprise
          </span>
        );
      case 'citizen':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            👤 Citoyen
          </span>
        );
    }
  };

  const getVerificationBadge = () => {
    switch (user.verificationStatus) {
      case 'verified':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '12px', background: 'rgba(0, 133, 63, 0.1)', color: 'var(--primary)', fontWeight: 'bold', border: '1px solid rgba(0, 133, 63, 0.2)' }}>
            🛡️ Identité Certifiée CNI
          </span>
        );
      case 'pending':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', fontWeight: 'bold', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            ⏳ En attente KYC
          </span>
        );
      case 'rejected':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontWeight: 'bold', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            ✕ KYC Rejeté
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.65rem', fontSize: '0.75rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-secondary-light)', fontWeight: 'bold', border: '1px solid var(--border-light)' }}>
            👤 Profil non vérifié
          </span>
        );
    }
  };

  const handleStartChat = () => {
    setActiveChatUserId(user.id);
    setSelectedPublicUserId(null);
    if (onNavigate) {
      onNavigate('profile', { target: 'messages' });
    }
  };

  if (showReportForm) {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => { setShowReportForm(false); setSelectedPublicUserId(null); }}
      >
        <div 
          className="glass animate-fade-in"
          style={{
            maxWidth: '460px',
            width: '100%',
            background: 'var(--light-card)',
            borderRadius: 'var(--radius-lg)',
            padding: isMobileView ? '1.25rem' : '2rem',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            🚨 Signaler {user.name}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            Veuillez indiquer la raison précise pour laquelle vous signalez cet utilisateur. Votre signalement sera transmis directement à l'administration de Sunu Yité pour vérification.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Motif du signalement :</label>
            <select
              className="premium-card"
              style={{ padding: '0.6rem', fontSize: '0.85rem', width: '100%', borderRadius: 'var(--radius-sm)' }}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="">-- Choisir un motif --</option>
              <option value="Fraude / Escroquerie (Tontine / Cagnotte)">💸 Fraude / Escroquerie (Tontine / Cagnotte)</option>
              <option value="Usurpation d'identité / Faux profil">🎭 Usurpation d'identité / Faux profil</option>
              <option value="Harcèlement / Comportement abusif">🗣️ Harcèlement / Comportement abusif</option>
              <option value="Spam / Contenu inapproprié">Spam / Contenu inapproprié</option>
              <option value="Autre raison (à préciser ci-dessous)">Autre raison (à préciser ci-dessous)</option>
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '0.5rem' }}>Détails / Précisions :</label>
            <textarea
              rows={3}
              placeholder="Décrivez en quelques mots pourquoi ce profil pose problème..."
              className="premium-card"
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', resize: 'none', borderRadius: 'var(--radius-sm)' }}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
              onClick={() => { setShowReportForm(false); setReportReason(''); setReportDetails(''); }}
            >
              Annuler
            </button>
            <button
              className="btn"
              style={{ flex: 1.5, padding: '0.6rem', fontSize: '0.85rem', background: 'var(--danger)', color: 'white', fontWeight: 'bold', borderRadius: 'var(--radius-sm)' }}
              onClick={handleSendReport}
            >
              Envoyer le signalement
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: isMobileView ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobileView ? 0 : '1rem'
      }}
      onClick={() => setSelectedPublicUserId(null)}
    >
      <div 
        className="glass animate-fade-in animate-slide-up"
        style={{
          maxWidth: '520px',
          width: '100%',
          maxHeight: isMobileView ? '88vh' : '90vh',
          overflowY: 'auto',
          background: 'var(--light-card)',
          borderRadius: isMobileView ? '24px 24px 0 0' : 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modern Cover Header */}
        <div 
          style={{
            height: '110px',
            background: 'linear-gradient(135deg, #00853f 0%, #006830 50%, #fcd116 100%)',
            position: 'relative',
            borderRadius: isMobileView ? '24px 24px 0 0' : 'var(--radius-lg) var(--radius-lg) 0 0'
          }}
        >
          {/* Close Button */}
          <button 
            style={{
              position: 'absolute',
              top: '0.85rem',
              right: '0.85rem',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              zIndex: 10
            }}
            onClick={() => setSelectedPublicUserId(null)}
            title="Fermer le profil"
          >
            ✕
          </button>
        </div>

        {/* Profile Info Container */}
        <div style={{ padding: isMobileView ? '0 1.25rem 1.5rem' : '0 1.75rem 2rem', marginTop: '-45px' }}>
          {/* Avatar & Title Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.25rem' }}>
            <div 
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                backgroundImage: `url("${user.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid white',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                marginBottom: '0.75rem',
                position: 'relative'
              }}
            >
              {user.verificationStatus === 'verified' && (
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                  <VerifiedBadge size={22} variant="emerald" />
                </div>
              )}
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
              {user.name}
            </h2>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary-light)', fontWeight: 700, marginBottom: '0.75rem' }}>
              {user.role === 'admin' ? '🛡️ Administrateur' : user.role === 'organizer' ? '👑 Organisateur' : '👤 Citoyen Engagé'}
            </span>

            {/* Badges Chips Row */}
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              {getAccountTypeBadge()}
              <TrustScore score={user.trustScore} />
              {getVerificationBadge()}
            </div>
          </div>

          {/* Profile Bio & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            {/* Bio Card */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.35rem' }}>
                📝 Biographie
              </strong>
              <p style={{ margin: 0, fontStyle: user.bio ? 'normal' : 'italic', color: user.bio ? 'var(--text-main)' : 'var(--text-secondary-light)', lineHeight: '1.4' }}>
                {user.bio || "Aucune biographie renseignée par cet utilisateur."}
              </p>
            </div>

            {/* Localisation & Phone Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ background: 'white', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <strong style={{ display: 'block', color: 'var(--text-secondary-light)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>
                  📍 Localisation
                </strong>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.region || 'Dakar'}, {user.country || 'Sénégal'}</span>
              </div>

              <div style={{ background: 'white', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <strong style={{ display: 'block', color: 'var(--text-secondary-light)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>
                  📱 Contact
                </strong>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.phone || 'Non renseigné'}</span>
              </div>
            </div>

            {/* Impact & Activités Overview */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '0.75rem' }}>
                📊 {t('profile.impact_activities')}
              </strong>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: 'rgba(0,133,63,0.04)', padding: '0.75rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,133,63,0.12)' }}>
                  <span style={{ fontSize: '1.25rem', display: 'block' }}>📢</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)', display: 'block', margin: '0.2rem 0 0.1rem 0' }}>
                    {organizedPetitions.length + organizedCagnottes.length}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary-light)', fontWeight: 600 }}>{t('profile.created_causes')}</span>
                </div>

                <div style={{ background: 'rgba(252,209,22,0.06)', padding: '0.75rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(252,209,22,0.2)' }}>
                  <span style={{ fontSize: '1.25rem', display: 'block' }}>✍️</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--secondary-dark)', display: 'block', margin: '0.2rem 0 0.1rem 0' }}>
                    {signedPetitionsCount}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary-light)', fontWeight: 600 }}>Signatures</span>
                </div>

                <div style={{ background: 'rgba(59,130,246,0.04)', padding: '0.75rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <span style={{ fontSize: '1.25rem', display: 'block' }}>🪙</span>
                  <strong style={{ fontSize: '1.1rem', color: '#3b82f6', display: 'block', margin: '0.2rem 0 0.1rem 0' }}>
                    {donationsCount + tontinesCount}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary-light)', fontWeight: 600 }}>Dons / Tontines</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button
              className="btn btn-outline"
              style={{ flex: 1, padding: '0.65rem 0.5rem', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}
              onClick={() => setSelectedPublicUserId(null)}
            >
              Fermer
            </button>
            
            {currentUser && !isSelf && (
              <>
                <button
                  className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                  style={{ flex: 1.2, padding: '0.65rem 0.5rem', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderColor: isFollowing ? 'var(--danger)' : undefined, color: isFollowing ? 'var(--danger)' : undefined }}
                  onClick={() => isFollowing ? unfollowUser(user.id) : followUser(user.id)}
                >
                  {isFollowing ? '❌ Désabonner' : '✨ Suivre'}
                </button>

                <button
                  className="btn btn-primary"
                  style={{
                    flex: 1.4,
                    padding: '0.65rem 0.5rem',
                    fontSize: '0.82rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    opacity: canContact ? 1 : 0.6,
                    cursor: canContact ? 'pointer' : 'not-allowed'
                  }}
                  disabled={!canContact}
                  onClick={handleStartChat}
                  title={!canContact ? "Vous devez suivre cet utilisateur ou être suivi par lui pour pouvoir le contacter." : ""}
                >
                  💬 Contacter
                </button>
              </>
            )}
          </div>

          {currentUser && !isSelf && !canContact && (
            <p style={{ margin: '0.6rem 0 0', fontSize: '0.73rem', color: 'var(--text-secondary-light)', textAlign: 'center', fontStyle: 'italic' }}>
              ℹ️ Pour contacter ce membre, abonnez-vous à son profil.
            </p>
          )}

          {currentUser && !isSelf && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.4rem', fontSize: '0.75rem', color: 'var(--danger)', width: '100%', marginTop: '0.75rem', fontWeight: 'bold' }}
              onClick={() => setShowReportForm(true)}
            >
              🚨 Signaler cet utilisateur
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
