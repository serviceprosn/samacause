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
  const { toggleTheme, activeTheme, currentUser } = useApp();

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
            Sunu<span style={{ color: 'var(--primary)' }}> Yité</span>
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
