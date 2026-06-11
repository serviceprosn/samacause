import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

interface MobileShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAi?: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

export const MobileShell: React.FC<MobileShellProps> = ({ 
  children, 
  activeTab, 
  setActiveTab,
  onOpenAi,
  onNavigate
}) => {
  const { toggleTheme, activeTheme, currentUser, isInstallable, installApp } = useApp();

  const [showIOSBanner, setShowIOSBanner] = React.useState(false);

  React.useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    if (isAppleDevice && !isStandaloneMode) {
      setShowIOSBanner(true);
    }
  }, []);

  return (
    <div className="mobile-shell-frame animate-fade-in">
      {/* Top Notch & Status Bar */}
      <div className="mobile-notch" />
      <div 
        className="mobile-status-bar"
        style={{
          height: '40px',
          background: 'var(--light-card)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 20px 0',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          color: 'var(--text-primary-light)',
          userSelect: 'none'
        }}
      >
        <span>10:52</span>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Sleek Mobile Top App Bar */}
      <div className="mobile-app-header">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
          onClick={() => { if (onNavigate) onNavigate('home'); else setActiveTab('home'); }}
        >
          <Logo size={24} />
          <strong style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Sama<span style={{ color: 'var(--primary)' }}>Cause</span>
          </strong>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {/* Admin panel or AI Assistant button */}
          {currentUser?.role === 'admin' ? (
            <button 
              className="btn" 
              style={{ 
                padding: '0.35rem 0.6rem', 
                fontSize: '0.7rem', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--warning)',
                color: 'var(--dark)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 'bold',
                border: '1px solid var(--warning)'
              }}
              onClick={() => {
                if (onNavigate) onNavigate('admin');
              }}
            >
              🛡️ <span>Admin</span>
            </button>
          ) : (
            <button 
              className="btn" 
              style={{ 
                padding: '0.35rem 0.6rem', 
                fontSize: '0.7rem', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--dark)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              onClick={() => {
                if (currentUser) {
                  if (onOpenAi) onOpenAi();
                } else {
                  if (onNavigate) onNavigate('auth', { openAiOnSuccess: true });
                }
              }}
            >
              🤖 <span>IA</span>
            </button>
          )}

          {/* PWA Install Button */}
          {isInstallable && (
            <button 
              className="btn btn-ghost" 
              style={{ padding: '0.35rem', minWidth: 'auto', fontSize: '0.9rem' }}
              onClick={installApp}
              title="Installer l'application"
            >
              📲
            </button>
          )}

          {/* Theme selector */}
          <button 
            className="btn btn-ghost" 
            style={{ padding: '0.35rem', minWidth: 'auto', fontSize: '0.8rem' }}
            onClick={toggleTheme}
          >
            {activeTheme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* User profile avatar or connection button */}
          {currentUser ? (
            <div 
              title={currentUser.name}
              style={{ 
                width: '26px', 
                height: '26px', 
                borderRadius: '50%', 
                backgroundImage: `url(${currentUser.avatar})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer',
                border: '1.5px solid var(--primary)'
              }}
              onClick={() => { if (onNavigate) onNavigate('profile'); else setActiveTab('profile'); }}
            />
          ) : (
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.65rem', borderRadius: 'var(--radius-sm)' }}
              onClick={() => { if (onNavigate) onNavigate('auth'); else setActiveTab('profile'); }}
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* PWA Mobile Banner Android/Chrome */}
      {isInstallable && (
        <div 
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #006630 100%)',
            color: 'white',
            padding: '0.65rem 1rem',
            fontSize: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.1rem' }}>📲</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>Sama Cause App</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>Ajouter à l'écran d'accueil</div>
            </div>
          </div>
          <button 
            onClick={installApp}
            style={{
              background: 'var(--secondary)',
              color: 'var(--dark)',
              padding: '0.35rem 0.75rem',
              fontSize: '0.7rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            INSTALLER
          </button>
        </div>
      )}

      {/* PWA Mobile Banner iOS/Safari */}
      {showIOSBanner && (
        <div 
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: 'white',
            padding: '0.65rem 1rem',
            fontSize: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🍎</span>
              <strong>Sama Cause sur iPhone</strong>
            </div>
            <button 
              onClick={() => setShowIOSBanner(false)} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          </div>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.4' }}>
            Pour installer, appuyez sur le bouton **Partager** <span style={{ fontSize: '0.9rem' }}>📤</span> dans Safari, puis sélectionnez **"Ajouter sur l'écran d'accueil"** <span style={{ fontSize: '0.9rem' }}>➕</span>.
          </p>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mobile-shell-content">
        {children}
      </div>

      {/* Bottom Tab Bar */}
      <div className="mobile-tab-bar">
        <button 
          className={`mobile-tab-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
          style={{ background: 'none', border: 'none' }}
        >
          <span style={{ fontSize: '1.2rem' }}>🏠</span>
          <span>Accueil</span>
        </button>

        <button 
          className={`mobile-tab-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
          style={{ background: 'none', border: 'none' }}
        >
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <span>Explorer</span>
        </button>

        <button 
          className={`mobile-tab-item ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
          style={{ background: 'none', border: 'none' }}
        >
          <span style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 'bold' }}>➕</span>
          <span>Créer</span>
        </button>

        <button 
          className={`mobile-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{ background: 'none', border: 'none' }}
        >
          <span style={{ fontSize: '1.2rem' }}>👤</span>
          <span>Profil</span>
        </button>
      </div>
    </div>
  );
};
