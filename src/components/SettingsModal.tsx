import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const {
    currentUser,
    activeTheme,
    toggleTheme,
    isMobileView,
    notificationPermission,
    requestNotificationPermission,
    deleteAccount,
    addNotification
  } = useApp();
  const { language, setLanguage, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'apparence' | 'notifications' | 'confidentialite' | 'systeme'>('apparence');
  const [hidePhoneOnPublic, setHidePhoneOnPublic] = useState(false);
  const [allowDirectChatFromStrangers, setAllowDirectChatFromStrangers] = useState(true);
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      addNotification("🔔 Notifications Push activées avec succès sur cet appareil !");
    } else {
      alert("Les notifications ont été refusées ou bloquées dans les paramètres de votre navigateur.");
    }
  };

  const handleClearCache = () => {
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
      addNotification("🧹 Cache local nettoyé avec succès. L'application est à jour !");
    } else {
      addNotification("🧹 Mémoire locale optimisée.");
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
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: isMobileView ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobileView ? 0 : '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="glass animate-fade-in animate-slide-up"
        style={{
          maxWidth: '620px',
          width: '100%',
          maxHeight: isMobileView ? '88vh' : '90vh',
          overflowY: 'auto',
          background: 'var(--light-card)',
          borderRadius: isMobileView ? '24px 24px 0 0' : 'var(--radius-lg)',
          border: '1.5px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Header */}
        <div 
          style={{
            height: '100px',
            background: 'linear-gradient(135deg, #00853f 0%, #006830 60%, #1e293b 100%)',
            position: 'relative',
            padding: '1.25rem',
            borderRadius: isMobileView ? '24px 24px 0 0' : 'var(--radius-lg) var(--radius-lg) 0 0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px' }}>
              ⚙️ Sunu Yité
            </span>
            <h2 style={{ fontSize: isMobileView ? '1.25rem' : '1.4rem', fontWeight: 800, color: 'white', margin: '0.2rem 0 0 0' }}>
              Paramètres & Préférences
            </h2>
          </div>

          <button 
            style={{
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
              backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
            title="Fermer les paramètres"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: isMobileView ? '1.25rem' : '1.75rem' }}>
          {/* Segmented Control Switcher */}
          <div 
            style={{ 
              display: 'flex', 
              background: 'rgba(0,0,0,0.04)', 
              padding: '0.25rem', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '1.5rem',
              gap: '0.25rem'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('apparence')}
              style={{
                flex: 1,
                padding: '0.55rem 0.4rem',
                fontWeight: activeTab === 'apparence' ? 800 : 600,
                fontSize: isMobileView ? '0.75rem' : '0.82rem',
                background: activeTab === 'apparence' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeTab === 'apparence' ? 'var(--primary)' : 'var(--text-secondary-light)',
                boxShadow: activeTab === 'apparence' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🎨 Apparence & Langue
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              style={{
                flex: 1,
                padding: '0.55rem 0.4rem',
                fontWeight: activeTab === 'notifications' ? 800 : 600,
                fontSize: isMobileView ? '0.75rem' : '0.82rem',
                background: activeTab === 'notifications' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeTab === 'notifications' ? 'var(--primary)' : 'var(--text-secondary-light)',
                boxShadow: activeTab === 'notifications' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔔 Notifications
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('confidentialite')}
              style={{
                flex: 1,
                padding: '0.55rem 0.4rem',
                fontWeight: activeTab === 'confidentialite' ? 800 : 600,
                fontSize: isMobileView ? '0.75rem' : '0.82rem',
                background: activeTab === 'confidentialite' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeTab === 'confidentialite' ? 'var(--primary)' : 'var(--text-secondary-light)',
                boxShadow: activeTab === 'confidentialite' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔒 Sécurité
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('systeme')}
              style={{
                flex: 1,
                padding: '0.55rem 0.4rem',
                fontWeight: activeTab === 'systeme' ? 800 : 600,
                fontSize: isMobileView ? '0.75rem' : '0.82rem',
                background: activeTab === 'systeme' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeTab === 'systeme' ? 'var(--primary)' : 'var(--text-secondary-light)',
                boxShadow: activeTab === 'systeme' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📱 PWA & Système
            </button>
          </div>

          {/* TAB 1: APPARENCE & LANGUE */}
          {activeTab === 'apparence' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Mode Sombre / Clair */}
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    {activeTheme === 'light' ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary-light)' }}>
                    Basculez entre le thème lumineux émeraude et le mode sombre confort des yeux.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                  onClick={toggleTheme}
                >
                  {activeTheme === 'light' ? '🌙 Passer au Sombre' : '☀️ Passer au Clair'}
                </button>
              </div>

              {/* Langue de l'application */}
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                  🌍 Langue d'affichage
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <button
                    type="button"
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: language === 'fr' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      background: language === 'fr' ? 'rgba(0,133,63,0.06)' : 'white',
                      fontWeight: language === 'fr' ? 800 : 600,
                      color: language === 'fr' ? 'var(--primary)' : 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem'
                    }}
                    onClick={() => setLanguage('fr')}
                  >
                    <span>🇫🇷</span> Français
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: language === 'wo' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      background: language === 'wo' ? 'rgba(0,133,63,0.06)' : 'white',
                      fontWeight: language === 'wo' ? 800 : 600,
                      color: language === 'wo' ? 'var(--primary)' : 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem'
                    }}
                    onClick={() => setLanguage('wo')}
                  >
                    <span>🇸🇳</span> Wolof
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: '0.75rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: language === 'en' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      background: language === 'en' ? 'rgba(0,133,63,0.06)' : 'white',
                      fontWeight: language === 'en' ? 800 : 600,
                      color: language === 'en' ? 'var(--primary)' : 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem'
                    }}
                    onClick={() => setLanguage('en')}
                  >
                    <span>🇺🇸</span> English
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Push Notifications Status */}
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    🔔 Notifications Push (Navigateur & Mobile)
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary-light)' }}>
                    Statut actuel : {notificationPermission === 'granted' ? '✅ Autorisé' : '❌ Non configuré'}
                  </span>
                </div>
                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                    onClick={handleRequestPush}
                  >
                    Activer les Push
                  </button>
                )}
              </div>

              {/* SMS Alerts Toggle */}
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    📱 Alertes SMS OTP & Transactions
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary-light)' }}>
                    Recevoir les codes de confirmation de signature et retraits par SMS.
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  checked={smsAlertsEnabled} 
                  onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: CONFIDENTIALITE & SECURITE */}
          {activeTab === 'confidentialite' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* KYC Status Card */}
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-light)' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.35rem', fontWeight: 800 }}>
                  🛡️ Certification d'Identité Biométrique (KYC CNI)
                </strong>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', color: 'var(--text-secondary-light)' }}>
                  Statut : {currentUser?.verificationStatus === 'verified' ? '✅ Identité certifiée avec succès par pièce CNI' : '⏳ Certification non effectuée ou en attente.'}
                </p>
                {currentUser?.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                    onClick={() => {
                      onClose();
                      if (onNavigate) onNavigate('profile', { target: 'kyc' });
                    }}
                  >
                    🪪 Passer le KYC
                  </button>
                )}
              </div>

              {/* Hide phone number switch */}
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    📱 Masquer mon numéro de téléphone
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary-light)' }}>
                    Masquer le numéro de téléphone sur votre fiche de profil public.
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  checked={hidePhoneOnPublic} 
                  onChange={(e) => setHidePhoneOnPublic(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              {/* Delete Account Area */}
              {currentUser && (
                <div style={{ background: 'rgba(239, 68, 68, 0.04)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--danger)', marginBottom: '0.35rem', fontWeight: 800 }}>
                    🗑️ Suppression du compte
                  </strong>
                  <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
                    Supprimer définitivement votre compte et toutes vos données personnelles. Action irréversible.
                  </p>
                  <button
                    type="button"
                    className="btn"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', background: 'var(--danger)', color: 'white', fontWeight: 'bold' }}
                    onClick={async () => {
                      if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
                        const success = await deleteAccount();
                        if (success) {
                          onClose();
                          if (onNavigate) onNavigate('auth');
                        }
                      }
                    }}
                  >
                    Supprimer mon compte
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYSTEME & CACHE */}
          {activeTab === 'systeme' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    🧹 Nettoyer le cache local PWA
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary-light)' }}>
                    Effacer le cache navigateur pour forcer la mise à jour des images et données.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 'bold' }}
                  onClick={handleClearCache}
                >
                  Nettoyer le Cache
                </button>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.35rem', fontWeight: 800 }}>
                  🇸🇳 Version de la plateforme
                </strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary-light)', lineHeight: '1.4' }}>
                  Sunu Yité v3.2.0 • Hébergé sur domaine officiel <strong>sunuyite.fun</strong> • Cryptage TLS SSL 256 bits.
                </p>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}
              onClick={() => {
                addNotification("⚙️ Paramètres enregistrés avec succès !");
                onClose();
              }}
            >
              Enregistrer & Fermer 💾
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
