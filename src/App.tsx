import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Home } from './pages/Home';
import { Petitions } from './pages/Petitions';
import { Cagnottes } from './pages/Cagnottes';
import { Benevolat } from './pages/Benevolat';
import { Diaspora } from './pages/Diaspora';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';
import { SidebarIA } from './components/SidebarIA';
import { MobileShell } from './components/MobileShell';
import { Logo } from './components/Logo';
import { Auth } from './pages/Auth';
import { CreateHub } from './pages/CreateHub';
import { Tontines } from './pages/Tontines';
import { Explorer } from './pages/Explorer';
import { PublicProfileModal } from './components/PublicProfileModal';
import { DirectChatPanel } from './components/DirectChatPanel';


const MainLayout: React.FC = () => {
  const { 
    activeTheme, 
    toggleTheme, 
    isMobileView, 
    setIsMobileView, 
    notifications,
    currentUser,
    logout,
    addNotification,
    isProfileComplete,
    directMessages,
    activeChatUserId,
    isInstallable,
    installApp
  } = useApp();

  const [currentPage, setCurrentPage] = useState('home');
  const [showInstallNotification, setShowInstallNotification] = useState(false);
  const [isIOSDevices, setIsIOSDevices] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplashScreen(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(userAgent);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    // Always show notification on entry/reload if not already in standalone mode
    if (!isStandaloneMode) {
      setShowInstallNotification(true);
    }
    
    if (isApple) {
      setIsIOSDevices(true);
    }
  }, []);

  React.useEffect(() => {
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isInstallable && !isStandaloneMode) {
      setShowInstallNotification(true);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    if (isInstallable) {
      await installApp();
    } else {
      if (isIOSDevices) {
        alert("Pour installer l'application sur iOS : appuyez sur le bouton 'Partager' (📤 en bas de Safari) puis sélectionnez 'Ajouter sur l'écran d'accueil' (➕).");
      } else {
        alert("Pour installer l'application : cliquez sur le menu de votre navigateur (les trois points ⋮ en haut à droite) puis sélectionnez 'Ajouter à l'écran d'accueil' ou 'Installer'.");
      }
    }
    setShowInstallNotification(false);
  };

  const handleIgnore = () => {
    setShowInstallNotification(false);
  };
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auto-open chat drawer when a user is selected to chat
  React.useEffect(() => {
    if (activeChatUserId) {
      setIsChatOpen(true);
    }
  }, [activeChatUserId]);

  // Check URL query parameters for direct shared links (private tontines, etc.)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tontineId = params.get('tontine') || params.get('tontineData');
    if (tontineId) {
      setCurrentPage('tontines');
      setNavParams({ tontineId });
    }
  }, []);

  const [navParams, setNavParams] = useState<any>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<{ page: string; params?: any } | null>(null);
  const [openAiOnSuccess, setOpenAiOnSuccess] = useState(false);

  // For auto-filling form data from AI generation
  const [aiAppliedData, setAiAppliedData] = useState<any>(null);

  const handleApplyAITemplates = (data: { title: string; description: string; petitionText?: string }) => {
    setAiAppliedData(data);
  };

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'auth') {
      if (params?.redirectPage) {
        setRedirectTarget({ 
          page: params.redirectPage, 
          params: { 
            id: params.redirectId, 
            view: params.redirectView, 
            action: params.triggerAction 
          } 
        });
      } else {
        setRedirectTarget(null);
      }
      if (params?.openAiOnSuccess) {
        setOpenAiOnSuccess(true);
      } else {
        setOpenAiOnSuccess(false);
      }
      setCurrentPage('auth');
      return;
    }

    // Gating for admin or profile pages
    if (!currentUser && (page === 'admin' || page === 'profile')) {
      setRedirectTarget({ page, params });
      setCurrentPage('auth');
      return;
    }

    // Citizen profile completion gating
    const pagesRequiringCompletion = ['create-hub', 'tontines'];
    const isCreateView = params?.view === 'create';
    
    if (currentUser && (pagesRequiringCompletion.includes(page) || isCreateView)) {
      if (!isProfileComplete(currentUser)) {
        addNotification("🔒 Profil incomplet. Renseignez vos informations d'identification pour la sécurité.");
        setCurrentPage('profile');
        setNavParams({ requireCompletion: true });
        return;
      }
    }

    setCurrentPage(page);
    setNavParams(params || null);
  };

  const scrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage('home');
    setTimeout(() => {
      const el = document.getElementById('contact-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleAuthSuccess = () => {
    if (openAiOnSuccess) {
      setOpenAiOnSuccess(false);
      setIsAiOpen(true);
    }
    if (redirectTarget) {
      setCurrentPage(redirectTarget.page);
      setNavParams(redirectTarget.params || null);
      setRedirectTarget(null);
    } else {
      setCurrentPage('home');
      setNavParams(null);
    }
  };

  // Switch pages inside the mobile shell frame
  const handleMobileTabChange = (tab: string) => {
    if (tab === 'create') {
      if (!currentUser) {
        handleNavigate('auth', { redirectPage: 'create-hub' });
      } else if (!isProfileComplete(currentUser)) {
        addNotification("🔒 Profil incomplet. Renseignez vos informations d'identification pour la sécurité.");
        setCurrentPage('profile');
        setNavParams({ requireCompletion: true });
      } else {
        setCurrentPage('create-hub');
        setNavParams(null);
      }
    } else if (tab === 'profile') {
      if (!currentUser) {
        handleNavigate('auth', { redirectPage: 'profile' });
      } else {
        setCurrentPage('profile');
        setNavParams(null);
      }
    } else if (tab === 'home') {
      setCurrentPage('home');
      setNavParams(null);
    } else if (tab === 'explore') {
      setCurrentPage('explore');
      setNavParams(null);
    }
  };

  const getMobileActiveTab = () => {
    if (currentPage === 'home') return 'home';
    if (currentPage === 'create-hub') return 'create';
    if (currentPage === 'explore' || currentPage === 'cagnottes' || currentPage === 'petitions' || currentPage === 'benevolat' || currentPage === 'diaspora') return 'explore';
    if (currentPage === 'profile') return 'profile';
    if (currentPage === 'auth') return 'profile';
    return 'explore';
  };

  // Render the active route
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'explore':
        return <Explorer onNavigate={handleNavigate} />;
      case 'petitions':
        return <Petitions initialPetitionId={navParams?.id} initialView={navParams?.view} initialAction={navParams?.action} onNavigate={handleNavigate} aiAppliedData={aiAppliedData} setAiAppliedData={setAiAppliedData} />;
      case 'cagnottes':
        return <Cagnottes initialCagnotteId={navParams?.id} initialView={navParams?.view} initialAction={navParams?.action} onNavigate={handleNavigate} aiAppliedData={aiAppliedData} setAiAppliedData={setAiAppliedData} />;
      case 'benevolat':
        return <Benevolat initialMissionId={navParams?.id} initialView={navParams?.view} initialAction={navParams?.action} onNavigate={handleNavigate} />;
      case 'diaspora':
        return <Diaspora onNavigate={handleNavigate} />;
      case 'admin':
        return <Admin />;
      case 'profile':
        return <Profile onNavigate={handleNavigate} initialParams={navParams} />;
      case 'create-hub':
        return <CreateHub onNavigate={handleNavigate} />;
      case 'tontines':
        return <Tontines onNavigate={handleNavigate} initialTontineId={navParams?.tontineId || navParams?.id} />;
      case 'auth':
        return <Auth onSuccess={handleAuthSuccess} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* PWA Splash Screen */}
      {showSplashScreen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#0A3A60',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'opacity 0.4s ease',
            opacity: showSplashScreen ? 1 : 0,
            pointerEvents: showSplashScreen ? 'auto' : 'none'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', textAlign: 'center', padding: '2rem' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div 
                style={{
                  position: 'absolute',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: '#00853F',
                  borderLeftColor: '#FDB913',
                  borderRightColor: '#E31B23',
                  animation: 'spin 2s linear infinite'
                }}
              />
              <img 
                src="/logo.png" 
                alt="Sunu Yité Logo" 
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  objectFit: 'contain',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  animation: 'pulseScale 2s infinite'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
                Sunu<span style={{ color: '#FDB913' }}> Yité</span>
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Mobilisation & Solidarité 🇸🇳
              </p>
            </div>
            
            <div style={{ width: '150px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop: '1rem' }}>
              <div className="splash-progress" style={{ height: '100%', background: 'linear-gradient(90deg, #FDB913, #00853F, #E31B23)', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      )}
      {/* DESKTOP HEADER & GLOBAL NAVIGATION */}
      <header 
        className="glass desktop-header-only"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          borderBottom: '1px solid var(--border-light)',
          padding: '0.75rem 0'
        }}
      >
        <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo symbol & Title */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => handleNavigate('home')}
          >
            <Logo size={32} />
            <strong style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Sunu<span style={{ color: 'var(--primary)' }}> Yité</span>
            </strong>
          </div>

          {/* Desktop Navigation Links */}
          {!isMobileView && (
            <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className={`btn ${currentPage === 'home' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('home')}
              >
                Accueil
              </button>
              <button 
                className={`btn ${currentPage === 'petitions' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('petitions')}
              >
                Pétitions
              </button>
              <button 
                className={`btn ${currentPage === 'cagnottes' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('cagnottes')}
              >
                Cagnottes
              </button>
              <button 
                className={`btn ${currentPage === 'benevolat' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('benevolat')}
              >
                Bénévolat
              </button>
              <button 
                className={`btn ${currentPage === 'tontines' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('tontines')}
              >
                Tontines 🪙
              </button>
              <button 
                className={`btn ${currentPage === 'diaspora' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('diaspora')}
              >
                Diaspora
              </button>
              
              {/* Quick toggle check for Admin roles */}
              {currentUser?.role === 'admin' && (
                <button 
                  className={`btn ${currentPage === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', color: 'var(--warning)', fontWeight: 'bold' }}
                  onClick={() => handleNavigate('admin')}
                >
                  Admin 🛡️
                </button>
              )}
            </nav>
          )}

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            
            {/* AI Assistant button */}
            <button 
              className="btn" 
              style={{ 
                padding: '0.5rem 0.85rem', 
                fontSize: '0.8rem', 
                borderRadius: 'var(--radius-sm)',
                background: 'var(--dark)',
                color: 'white'
              }}
              onClick={() => {
                if (currentUser) {
                  setIsAiOpen(true);
                } else {
                  handleNavigate('auth', { openAiOnSuccess: true });
                }
              }}
            >
              🤖 Assistant IA
            </button>

            {/* Theme selector */}
            <button 
              className="btn btn-ghost" 
              style={{ padding: '0.5rem', minWidth: 'auto' }}
              onClick={toggleTheme}
            >
              {activeTheme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Direct messages selector */}
            {currentUser && (
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.5rem', minWidth: 'auto', position: 'relative' }}
                onClick={() => setIsChatOpen(!isChatOpen)}
                title="Messagerie citoyenne"
              >
                💬
                {(() => {
                  const unreadCount = directMessages.filter(msg => msg.receiverId === currentUser.id && !msg.read).length;
                  return unreadCount > 0 ? (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: 'var(--danger)',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '0.1rem 0.35rem',
                        fontSize: '0.6rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {unreadCount}
                    </span>
                  ) : null;
                })()}
              </button>
            )}

            {/* Profile Avatar & Connexion/Déconnexion click */}
            {!isMobileView && (
              currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div 
                    title={currentUser.name}
                    style={{ 
                      width: '35px', 
                      height: '35px', 
                      borderRadius: '50%', 
                      backgroundImage: `url("${currentUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`, 
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                      border: '2px solid var(--primary)'
                    }}
                    onClick={() => handleNavigate('profile')}
                  />
                  <button 
                    className="btn btn-ghost" 
                    style={{ padding: '0.4rem 0.60rem', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}
                    onClick={logout}
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => handleNavigate('auth')}
                >
                  Connexion
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* GLOBAL NOTIFICATION DRAWER / TOAST */}
      {notifications.length > 0 && (
        <div className="notification-toast">
          <span>🔔</span>
          <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {notifications[0]}
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, padding: '2rem 0' }}>
        <div className="app-container">
          {isMobileView ? (
            <MobileShell 
              activeTab={getMobileActiveTab()} 
              setActiveTab={handleMobileTabChange}
              onOpenAi={() => setIsAiOpen(true)}
              onNavigate={handleNavigate}
            >
              {renderPage()}
            </MobileShell>
          ) : (
            renderPage()
          )}
        </div>
      </main>

      {/* FOOTER */}
      {!isMobileView && (
        <footer 
          style={{
            borderTop: '1px solid var(--border-light)',
            padding: '2.5rem 0',
            background: 'var(--light-card)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary-light)'
          }}
        >
          <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <strong style={{ color: 'var(--text-primary-light)' }}>Sunu Yité © 2026</strong>
              <div style={{ marginTop: '0.25rem' }}>Plateforme d'impact et de mobilisation citoyenne solidaire au Sénégal.</div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#charte">Charte de confiance</a>
              <a href="#mentions">Mentions légales</a>
              <a href="#contact" onClick={scrollToContact}>Contact & Support</a>
            </div>
          </div>
        </footer>
      )}

      {/* AI DRAWER */}
      <SidebarIA 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        onApplyData={handleApplyAITemplates}
      />

      {/* DIRECT MESSAGES DRAWER */}
      <DirectChatPanel 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* PUBLIC PROFILE MODAL */}
      <PublicProfileModal />

      {/* Floating PWA Install Notification Toast */}
      {showInstallNotification && (
        <div 
          className="premium-card animate-fade-in animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: isMobileView ? '16px' : '24px',
            left: isMobileView ? '16px' : 'auto',
            maxWidth: isMobileView ? 'calc(100% - 32px)' : '380px',
            zIndex: 9999,
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            padding: '1.25rem',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem', display: 'block', color: 'white' }}>Sunu Yité App</strong>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Installer sur cet appareil</span>
            </div>
            <button 
              onClick={handleIgnore}
              style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', padding: 0 }}
            >
              ✕
            </button>
          </div>
          
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            {isIOSDevices 
              ? "Appuyez sur Partager 📤 dans Safari, puis sélectionnez \"Ajouter sur l'écran d'accueil\" ➕." 
              : isInstallable
                ? "Installez l'application Sunu Yité pour un chargement instantané et un accès complet hors-ligne."
                : "Pour installer, cliquez sur l'icône d'installation dans la barre d'adresse ou ouvrez le menu de votre navigateur (⋮) puis sélectionnez \"Ajouter à l'écran d'accueil\" ou \"Installer\"."}
          </p>
    
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            {isMobileView ? (
              <button 
                onClick={handleInstall}
                style={{
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 10px rgba(0, 133, 63, 0.3)',
                  width: '100%'
                }}
              >
                Installer 💾
              </button>
            ) : (
              <>
                <button 
                  onClick={handleIgnore}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Ignorer
                </button>
                <button 
                  onClick={handleInstall}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 10px rgba(0, 133, 63, 0.3)'
                  }}
                >
                  Installer 💾
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;

