import React from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { TrustScore } from './TrustScore';

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
    unfollowUser
  } = useApp();
  const { t } = useLanguage();

  if (!selectedPublicUserId) return null;

  const user = usersList.find(u => u.id === selectedPublicUserId);
  if (!user) return null;

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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0, 133, 63, 0.1)', color: 'var(--primary)', fontWeight: 'bold' }}>
            🤝 ONG
          </span>
        );
      case 'company':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(30, 41, 59, 0.1)', color: 'var(--dark)', fontWeight: 'bold' }}>
            🏢 Entreprise
          </span>
        );
      case 'citizen':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontWeight: 'bold' }}>
            👤 Citoyen
          </span>
        );
    }
  };

  const getVerificationBadge = () => {
    switch (user.verificationStatus) {
      case 'verified':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0, 133, 63, 0.1)', color: 'var(--primary)', fontWeight: 'bold' }}>
            ✓ Identité Certifiée CNI
          </span>
        );
      case 'pending':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', fontWeight: 'bold' }}>
            ⏳ En attente de validation
          </span>
        );
      case 'rejected':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontWeight: 'bold' }}>
            ✕ Documents KYC Rejetés
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', background: 'rgba(0, 0, 0, 0.05)', color: 'var(--text-secondary-light)', fontWeight: 'bold' }}>
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

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={() => setSelectedPublicUserId(null)}
    >
      <div 
        className="glass animate-fade-in"
        style={{
          maxWidth: '500px',
          width: '100%',
          background: 'var(--light-card)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: 'var(--text-secondary-light)'
          }}
          onClick={() => setSelectedPublicUserId(null)}
        >
          ✕
        </button>

        {/* Profile Card Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div 
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundImage: `url("${user.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '3px solid var(--primary)',
              marginBottom: '1rem',
              boxShadow: 'var(--shadow-md)'
            }}
          />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
            {user.name}
            {user.verified && <span title={t('status.verified')} style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>✓</span>}
          </h2>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary-light)', fontWeight: 700, marginBottom: '0.75rem', display: 'block' }}>
            {user.role === 'admin' ? '🛡️ Administrateur' : user.role === 'organizer' ? '👑 Organisateur' : '👤 Citoyen'}
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            {getAccountTypeBadge()}
            <TrustScore score={user.trustScore} />
            {getVerificationBadge()}
          </div>
        </div>

        {/* Profile Info Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <strong style={{ display: 'block', color: 'var(--text-secondary-light)', marginBottom: '0.25rem' }}>Biographie</strong>
            <p style={{ margin: 0, fontStyle: user.bio ? 'normal' : 'italic', color: user.bio ? 'inherit' : 'var(--text-secondary-light)', lineHeight: '1.4' }}>
              {user.bio || "Aucune biographie fournie."}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-secondary-light)' }}>Localisation</strong>
              <span>{user.region || 'Dakar'}, {user.country || 'Sénégal'}</span>
            </div>
            <div>
              <strong style={{ display: 'block', color: 'var(--text-secondary-light)' }}>Contact</strong>
              <span>{user.phone || 'Non renseigné'}</span>
            </div>
          </div>

          {/* Activities Stats Overview */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <strong style={{ display: 'block', color: 'var(--text-secondary-light)', marginBottom: '0.75rem' }}>{t('profile.impact_activities')}</strong>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.25rem', display: 'block' }}>📢</span>
                <strong style={{ fontSize: '1rem', display: 'block', margin: '0.25rem 0 0.1rem 0' }}>
                  {organizedPetitions.length + organizedCagnottes.length}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>{t('profile.created_causes')}</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.25rem', display: 'block' }}>✍️</span>
                <strong style={{ fontSize: '1rem', display: 'block', margin: '0.25rem 0 0.1rem 0' }}>
                  {signedPetitionsCount}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>Signatures</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.25rem', display: 'block' }}>🪙</span>
                <strong style={{ fontSize: '1rem', display: 'block', margin: '0.25rem 0 0.1rem 0' }}>
                  {donationsCount + tontinesCount}
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>Dons / Tontines</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat / Action Button */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
          <button
            className="btn btn-outline"
            style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem' }}
            onClick={() => setSelectedPublicUserId(null)}
          >
            Fermer
          </button>
          
          {currentUser && !isSelf && (
            <>
              <button
                className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                style={{ flex: 1, padding: '0.65rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderColor: isFollowing ? 'var(--danger)' : undefined, color: isFollowing ? 'var(--danger)' : undefined }}
                onClick={() => isFollowing ? unfollowUser(user.id) : followUser(user.id)}
              >
                {isFollowing ? '❌ Désabonner' : '✨ Suivre'}
              </button>

              <button
                className="btn btn-primary"
                style={{
                  flex: 1.5,
                  padding: '0.65rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
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
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary-light)', textAlign: 'center', fontStyle: 'italic' }}>
            Pour envoyer un message, vous devez suivre cet utilisateur ou être suivi par lui.
          </p>
        )}
      </div>
    </div>
  );
};
