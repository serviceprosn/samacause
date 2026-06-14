import React from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { toggleTheme, activeTheme, currentUser, useSupabase } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            type="button"
            className="btn btn-ghost" 
            style={{ padding: '0.2rem', minWidth: 'auto', fontSize: '1.25rem', color: 'var(--text-primary-light)', display: 'flex', alignItems: 'center' }}
            onClick={() => setIsMenuOpen(true)}
          >
            ☰
          </button>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
            onClick={() => { if (onNavigate) onNavigate('home'); else setActiveTab('home'); }}
          >
            <Logo size={22} />
            <strong style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Sunu<span style={{ color: 'var(--primary)' }}> Yité</span>
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {/* Admin panel */}
          {currentUser?.role === 'admin' && (
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
          <span>{t('nav.home')}</span>
        </button>

        <button 
          className={`mobile-tab-item ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
          style={{ background: 'none', border: 'none' }}
        >
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <span>{t('nav.explorer').replace(' 🔍', '')}</span>
        </button>

        <button 
          className={`mobile-tab-item ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
          style={{ background: 'none', border: 'none' }}
        >
          <span style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 'bold' }}>➕</span>
          <span>{t('btn.create')}</span>
        </button>

        <button 
          className={`mobile-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{ background: 'none', border: 'none' }}
        >
          <span style={{ fontSize: '1.2rem' }}>👤</span>
          <span>{t('nav.profile')}</span>
        </button>
      </div>

      {/* Slide-out Menu Drawer */}
      {isMenuOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex'
          }}
          onClick={() => setIsMenuOpen(false)}
        >
          <div 
            className="animate-slide-right"
            style={{
              width: '80%',
              maxWidth: '280px',
              height: '100%',
              background: 'var(--light-card)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              textAlign: 'left',
              borderRight: '1px solid var(--border-light)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Logo size={24} />
                <strong style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  Sunu<span style={{ color: 'var(--primary)' }}> Yité</span>
                </strong>
              </div>
              <button 
                type="button"
                className="btn btn-ghost" 
                style={{ padding: '0.25rem', minWidth: 'auto', fontSize: '1.1rem', color: 'var(--text-primary-light)' }}
                onClick={() => setIsMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Menu List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              {[
                { name: t('nav.home'), page: 'home', icon: '🏠' },
                { name: t('nav.petitions'), page: 'petitions', icon: '✍️' },
                { name: t('nav.cagnottes'), page: 'cagnottes', icon: '💰' },
                { name: t('nav.benevolat'), page: 'benevolat', icon: '🛠️' },
                { name: t('nav.tontines').replace(' 🪙', ''), page: 'tontines', icon: '🔄' },
                { name: t('nav.diaspora'), page: 'diaspora', icon: '🌍' },
                { name: t('nav.explorer'), page: 'explore', icon: '🔍' },
              ].map((item) => (
                <button
                  key={item.page}
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    width: '100%',
                    justifyContent: 'flex-start',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-md)',
                    background: activeTab === item.page ? 'rgba(0,133,63,0.08)' : 'transparent',
                    color: activeTab === item.page ? 'var(--primary)' : 'var(--text-primary-light)',
                    fontWeight: activeTab === item.page ? 'bold' : 'normal',
                    textAlign: 'left',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onNavigate) {
                      onNavigate(item.page);
                    }
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            {/* Bottom User Profile card in menu */}
            {currentUser && (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    backgroundImage: `url(${currentUser.avatar})`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1.5px solid var(--primary)'
                  }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <strong style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', color: 'var(--text-primary-light)' }}>{currentUser.name}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{currentUser.email}</span>
                </div>
              </div>
            )}

            {/* Drawer Language Switcher */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary-light)', marginBottom: '0.4rem' }}>Langue / Kóbó :</div>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-light)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                {(['fr', 'wo', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      flex: 1,
                      padding: '0.35rem 0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: language === lang ? 'var(--primary)' : 'transparent',
                      color: language === lang ? 'white' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{lang === 'fr' ? '🇫🇷' : lang === 'wo' ? '🇸🇳' : '🇬🇧'}</span>
                    <span style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{lang}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Database Connection Badge */}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-light)', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary-light)' }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: useSupabase ? '#00853F' : '#f59e0b',
                display: 'inline-block'
              }} />
              <span>Base : {useSupabase ? 'En ligne (Supabase)' : 'Hors-ligne (Local)'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
