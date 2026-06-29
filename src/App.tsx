import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
    isBasicProfileComplete,
    directMessages,
    activeChatUserId,
    setActiveChatUserId,
    isInstallable,
    installApp,
    isDataLoaded
  } = useApp();
  const { language, setLanguage, t } = useLanguage();

  const unreadCount = currentUser && directMessages
    ? directMessages.filter(m => m.receiverId === currentUser.id && !m.read).length
    : 0;

  const [currentPage, setCurrentPage] = useState('home');
  const [showInstallNotification, setShowInstallNotification] = useState(false);
  const [isIOSDevices, setIsIOSDevices] = useState(false);
  // Skip splash screen if loading a direct cause/campaign link or returning from Google OAuth redirect
  const shouldSkipSplashScreen = () => {
    const params = new URLSearchParams(window.location.search);
    const hasCause = params.has('petition') || params.has('cagnotte') || params.has('benevolat') || params.has('mission') || params.has('tontine') || params.has('tontineData');
    if (hasCause) return true;

    // Check Google Auth redirect parameters
    const hasHashAuth = window.location.hash.includes('access_token=') || window.location.hash.includes('error=');
    const hasSearchAuth = window.location.search.includes('code=');
    return hasHashAuth || hasSearchAuth;
  };

  const [showSplashScreen, setShowSplashScreen] = useState(!shouldSkipSplashScreen());
  const [splashText, setSplashText] = useState('Connexion à la base de données...');
  const [activeModal, setActiveModal] = useState<null | 'charte' | 'mentions' | 'support'>(null);

  // Upgrade: Interactive Splash Screen States and Constants
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isLogoSpinning, setIsLogoSpinning] = useState(false);
  const [lionSpeechBubble, setLionSpeechBubble] = useState("Salamaalekum ! Touche mon nez pour me faire tourner ! 🦁🇸🇳");
  const [triviaIndex, setTriviaIndex] = useState(0);

  const triviaSlides = [
    {
      type: "proverb",
      title: t('splash.trivia_proverb_title'),
      text: "« Ndank ndank lañuy tàppe baaraada bi »",
      translation: language === 'wo' ? "Ndank ndank lañuy tàppe baaraada bi." : language === 'en' ? "Little by little, the teapot is filled." : "C'est petit à petit qu'on remplit la théière.",
      meaning: language === 'wo' ? "Muñ ak jëf lañuy ande." : language === 'en' ? "Patience and perseverance conquer all." : "Patience et persévérance triomphent de tout."
    },
    {
      type: "proverb",
      title: t('splash.trivia_proverb_title'),
      text: "« Nitt nitt moy garabam »",
      translation: language === 'wo' ? "Nitt nitt moy garabam." : language === 'en' ? "Man is the remedy of man." : "L'Homme est le remède de l'Homme.",
      meaning: language === 'wo' ? "Mbooloo ak dimballe." : language === 'en' ? "The spirit of solidarity, mutual aid, and Teranga." : "L'esprit de solidarité, d'entraide et de Teranga."
    },
    {
      type: "proverb",
      title: t('splash.trivia_proverb_title'),
      text: "« Ku muñ, muñool »",
      translation: language === 'wo' ? "Ku muñ, muñool." : language === 'en' ? "He who waits patiently will get what he desires." : "Celui qui sait patienter obtiendra ce qu'il désire.",
      meaning: language === 'wo' ? "Muñ am na solo." : language === 'en' ? "Patience is the key to relief and success." : "La patience est la clé du soulagement et du succès."
    },
    {
      type: "proverb",
      title: t('splash.trivia_proverb_title'),
      text: "« Bul xaar keneen dila suturaal, suturaalal sa bopp »",
      translation: language === 'wo' ? "Bul xaar keneen dila suturaal, suturaalal sa bopp." : language === 'en' ? "Do not wait for others to preserve you, act for yourself." : "N'attends pas que d'autres te préservent, agis pour toi-même.",
      meaning: language === 'wo' ? "Jëf ci sa bopp." : language === 'en' ? "The call for citizen and solidarity initiatives." : "L'appel à l'initiative citoyenne et solidaire."
    },
    {
      type: "trivia",
      title: t('splash.trivia_fact_title'),
      text: language === 'wo' ? "Teranga Sénégal du hospitalité simple kepp: dund la." : language === 'en' ? "Senegalese 'Teranga' is much more than simple hospitality: it is a way of life based on warm welcome, mutual respect, and civic sharing." : "La « Teranga » sénégalaise est bien plus qu'une simple hospitalité : c'est un art de vivre fondé sur l'accueil chaleureux, le respect mutuel et le partage citoyen."
    },
    {
      type: "trivia",
      title: t('splash.trivia_fact_title'),
      text: language === 'wo' ? "Lac Rose rose na ndax algue microscopique." : language === 'en' ? "Lake Retba (Pink Lake) owes its unique pink color to a microscopic alga that produces a red pigment to withstand the high salt concentration." : "Le Lac Rose (Lac Retba) doit sa couleur rose unique à une algue microscopique qui produit un pigment rouge pour résister à la concentration de sel."
    },
    {
      type: "trivia",
      title: t('splash.trivia_fact_title'),
      text: language === 'wo' ? "Monument Renaissance Africaine gënë rëy Statue Liberté." : language === 'en' ? "The African Renaissance Monument in Dakar measures 49 meters, making it taller than the Statue of Liberty!" : "Le Monument de la Renaissance Africaine à Dakar mesure 49 mètres, ce qui le rend plus grand que la Statue de la Liberté !"
    },
    {
      type: "trivia",
      title: t('splash.trivia_fact_title'),
      text: language === 'wo' ? "Parc Djoudj mo gënë rëy ci oiseau." : language === 'en' ? "The Djoudj National Bird Sanctuary is the third largest bird sanctuary in the world, welcoming millions of migratory birds each year." : "Le parc national des oiseaux du Djoudj est le troisième sanctuaire ornithologique au monde, accueillant des millions d'oiseaux migrateurs chaque année."
    }
  ];

  const lionPhrases = language === 'wo' ? [
    "Roarrr ! Mu ngi neex ! 🦁",
    "Gaynde Sunu Yité paré na ! 🦁🔥",
    "Wave ak Orange Money waaj nañ ! 💸",
    "Woyoo ! Wëräl ma waay ! 🔄",
    "Chut... Am na jëf yu rëy yu ñuy def ! 🤫",
    "Gaynde du dee, mu ngi xar rek ! 🦁💤",
    "Teranga bi doole na, sosal sa cagnotte ! ❤️",
    "Dëgg dëgg ! Mbooloo citoyen fii la ! ✊",
    "Ndank ndank lañuy tàppe baaraada bi ! 🍵",
    "Ndax xool nga tontine yi ? Saf na ! 💎",
    "100% transparent, 100% sénégalais ! 🇸🇳"
  ] : language === 'en' ? [
    "Roarrr! That tickles! 🦁",
    "Sunu Yite's lion is warming up! 🦁🔥",
    "Wave and Orange Money are ready to go! 💸",
    "Woyoo! Spin me again! 🔄",
    "Shh... Great things are coming for Louga and Dakar! 🤫",
    "A lion never dies, it just waits for loading! 🦁💤",
    "Teranga is in full swing, prepare your campaigns! ❤️",
    "Dëgg dëgg! The civic fight starts here! ✊",
    "Ndank ndank lañuy tàppe baaraada bi! 🍵",
    "Have you checked our secure tontines? Wonderful! 💎",
    "100% transparent, 100% Senegalese! 🇸🇳"
  ] : [
    "Roarrr ! Ça chatouille ! 🦁",
    "Le lion de Sunu Yité s'échauffe ! 🦁🔥",
    "Wave et Orange Money sont déjà chauds ! 💸",
    "Woyoo ! Tournez-moi encore ! 🔄",
    "Chut... On prépare du lourd pour Louga et Dakar ! 🤫",
    "Un lion ne meurt jamais, il attend le chargement complet ! 🦁💤",
    "La Teranga bat son plein, préparez vos cagnottes ! ❤️",
    "Dëgg dëgg ! Le combat citoyen commence ici ! ✊",
    "Ndank ndank lañuy tàppe baaraada bi ! 🍵",
    "Avez-vous vu nos tontines sécurisées ? Un régal ! 💎",
    "100% transparent, 100% sénégalais ! 🇸🇳"
  ];

  // Dynamic Splash Screen Text Cycle
  React.useEffect(() => {
    if (!showSplashScreen) return;
    const texts = [
      t('splash.connecting'),
      t('splash.securing'),
      t('splash.cagnottes'),
      t('splash.petitions'),
      t('splash.tontines'),
      t('splash.launches'),
      t('splash.volunteer'),
      t('splash.news'),
      t('splash.cache'),
      t('splash.space')
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setSplashText(texts[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [showSplashScreen, t]);

  // Slideshow Cycle for Proverb/Trivia
  React.useEffect(() => {
    if (!showSplashScreen) return;
    const interval = setInterval(() => {
      setTriviaIndex((prev) => (prev + 1) % triviaSlides.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [showSplashScreen]);

  // Interactive Particle System
  React.useEffect(() => {
    if (!showSplashScreen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Sparkle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      alpha: number;
      decay: number;
    }

    const sparkles: Sparkle[] = [];
    const colors = ['#00853F', '#FDB913', '#E31B23', '#FFD700']; // Senegal Green, Yellow, Red, Gold

    const createSparkle = (x: number, y: number, count = 1) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        sparkles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.3, // slight upward float
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 1,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      createSparkle(e.clientX, e.clientY, 2);
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleLogoBurst = (e: any) => {
      const { x, y } = e.detail || { x: width / 2, y: height / 2 };
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        sparkles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          alpha: 1,
          decay: Math.random() * 0.025 + 0.015
        });
      }
    };

    window.addEventListener('logo-burst' as any, handleLogoBurst as any);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = s.color;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('logo-burst' as any, handleLogoBurst as any);
      cancelAnimationFrame(animationFrameId);
    };
  }, [showSplashScreen]);

  const handleLogoHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isLogoSpinning) return;
    setIsLogoSpinning(true);
    
    // Get center coordinates of logo
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Dispatch custom burst event
    const event = new CustomEvent('logo-burst', { detail: { x: centerX, y: centerY } });
    window.dispatchEvent(event);

    // Set random lion phrase
    const randomPhrase = lionPhrases[Math.floor(Math.random() * lionPhrases.length)];
    setLionSpeechBubble(randomPhrase);

    setTimeout(() => {
      setIsLogoSpinning(false);
    }, 1000); // Duration of the spin animation
  };

  // Handle smart Splash Screen dismissal
  React.useEffect(() => {
    const startTime = Date.now();
    const minDuration = 800; // 800ms minimum for gorgeous but fast animations
    const safetyTimeout = 75000; // 75 seconds safety timeout to allow full database cold start loading
    
    let timer: any;
    let safetyTimer: any;

    const checkAndDismiss = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      timer = setTimeout(() => {
        setSplashText(t('splash.opening'));
        setTimeout(() => {
          setShowSplashScreen(false);
        }, 300); // Small final delay for fade out
      }, remaining);
    };

    if (isDataLoaded) {
      checkAndDismiss();
    } else {
      safetyTimer = setTimeout(() => {
        console.warn("Safety timeout: Dismissing splash screen before all online data loads.");
        setSplashText(t('splash.opening'));
        setTimeout(() => {
          setShowSplashScreen(false);
        }, 300);
      }, safetyTimeout);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
    };
  }, [isDataLoaded, t]);

  // Reset window scroll to top on page navigation
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Lock body scroll when a footer modal is active
  React.useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeModal]);

  // PWA notification handling disabled
  const handleInstall = async () => {};
  const handleIgnore = () => {};
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Auto-open chat drawer when a user is selected to chat (except on profile page)
  React.useEffect(() => {
    if (activeChatUserId && currentPage !== 'profile') {
      setIsChatOpen(true);
    }
  }, [activeChatUserId, currentPage]);

  // Close chat drawer and clear active chat when page changes
  React.useEffect(() => {
    setIsChatOpen(false);
    if (currentPage !== 'profile') {
      setActiveChatUserId(null);
    }
  }, [currentPage]);

  // Prevent body scroll when chat drawer is open
  React.useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isChatOpen]);

  const [navParams, setNavParams] = useState<any>(null);

  // Check URL query parameters for direct shared links (private tontines, etc.)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const tontineId = params.get('tontine') || params.get('tontineData');
    if (tontineId) {
      setCurrentPage('tontines');
      setNavParams({ tontineId });
      return;
    }

    const petitionId = params.get('petition');
    if (petitionId) {
      setCurrentPage('petitions');
      setNavParams({ 
        id: petitionId, 
        view: 'detail',
        action: params.get('action') || undefined
      });
      return;
    }

    const cagnotteId = params.get('cagnotte');
    if (cagnotteId) {
      setCurrentPage('cagnottes');
      setNavParams({ 
        id: cagnotteId, 
        view: 'detail',
        action: params.get('action') || undefined
      });
      return;
    }

    const benevolatId = params.get('benevolat') || params.get('mission');
    if (benevolatId) {
      setCurrentPage('benevolat');
      setNavParams({ 
        id: benevolatId, 
        view: 'detail',
        action: params.get('action') || undefined
      });
      return;
    }

    const page = params.get('page');
    if (page) {
      setCurrentPage(page);
      return;
    }
  }, []);

  // Sync state to URL query parameters
  React.useEffect(() => {
    const url = new URL(window.location.href);
    
    // Clear all cause/tontine related query params first
    url.searchParams.delete('tontine');
    url.searchParams.delete('tontineData');
    url.searchParams.delete('petition');
    url.searchParams.delete('cagnotte');
    url.searchParams.delete('benevolat');
    url.searchParams.delete('mission');
    url.searchParams.delete('action');
    url.searchParams.delete('page');

    if (currentPage === 'tontines' && navParams?.tontineId) {
      url.searchParams.set('tontine', navParams.tontineId);
    } else if (currentPage === 'petitions' && navParams?.id) {
      url.searchParams.set('petition', navParams.id);
      if (navParams.action) {
        url.searchParams.set('action', navParams.action);
      }
    } else if (currentPage === 'cagnottes' && navParams?.id) {
      url.searchParams.set('cagnotte', navParams.id);
      if (navParams.action) {
        url.searchParams.set('action', navParams.action);
      }
    } else if (currentPage === 'benevolat' && navParams?.id) {
      url.searchParams.set('benevolat', navParams.id);
      if (navParams.action) {
        url.searchParams.set('action', navParams.action);
      }
    } else if (currentPage !== 'home') {
      url.searchParams.set('page', currentPage);
    }

    url.pathname = '/';
    if (url.search !== window.location.search || window.location.pathname !== '/') {
      window.history.pushState({}, '', url.pathname + url.search);
    }
  }, [currentPage, navParams]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<{ page: string; params?: any } | null>(null);
  const [openAiOnSuccess, setOpenAiOnSuccess] = useState(false);

  // For auto-filling form data from AI generation
  const [aiAppliedData, setAiAppliedData] = useState<any>(null);

  const handleApplyAITemplates = (data: { title: string; description: string; petitionText?: string }) => {
    setAiAppliedData(data);
  };

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'messages') {
      if (currentPage === 'profile') {
        setNavParams({ target: 'messages' });
      } else {
        setIsChatOpen(prev => !prev);
      }
      return;
    }

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
    const isCreateView = params?.view === 'create';
    
    if (currentUser) {
      if (page === 'cagnottes' && isCreateView) {
        if (!isProfileComplete(currentUser)) {
          addNotification("🔒 Vérification d'identité (KYC) obligatoire pour pouvoir lancer une cagnotte solidaire.");
          setCurrentPage('profile');
          setNavParams({ requireCompletion: true, target: 'kyc' });
          return;
        }
      } else if (page === 'create-hub' || isCreateView) {
        if (!isBasicProfileComplete(currentUser)) {
          addNotification("🔒 Coordonnées de profil incomplètes. Veuillez renseigner vos informations de base.");
          setCurrentPage('profile');
          setNavParams({ requireCompletion: true, target: 'basic' });
          return;
        }
      }
    }

    if (params?.aiAppliedData) {
      setAiAppliedData(params.aiAppliedData);
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
      } else if (!isBasicProfileComplete(currentUser)) {
        addNotification("🔒 Coordonnées de profil incomplètes. Veuillez renseigner vos informations de base.");
        setCurrentPage('profile');
        setNavParams({ requireCompletion: true, target: 'basic' });
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

  let isBanned = false;
  let isSuspended = false;
  let suspensionEndDate: Date | null = null;
  let blockReasonText = "";

  if (currentUser && currentUser.role !== 'admin') {
    if (currentUser.trustScore <= 0) {
      if (currentUser.kycRejectReason && currentUser.kycRejectReason.startsWith('SuspendedUntil:')) {
        const parts = currentUser.kycRejectReason.split(';');
        const dateStr = parts[0].replace('SuspendedUntil:', '');
        const reasonPart = parts.find(p => p.startsWith('Reason:'));
        const reason = reasonPart ? reasonPart.replace('Reason:', '') : '';
        
        suspensionEndDate = new Date(dateStr);
        const now = new Date();
        
        if (suspensionEndDate > now) {
          isSuspended = true;
          blockReasonText = reason || "Non-respect de la charte de notre communauté.";
        }
      } else {
        isBanned = true;
        blockReasonText = currentUser.kycRejectReason === 'BannedPermanently' 
          ? "Suspicion d'activité frauduleuse ou de non-respect de nos règles communautaires." 
          : (currentUser.kycRejectReason || "Suspicion d'activité frauduleuse.");
      }
    }
  }

  if (isBanned || isSuspended) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '2rem', textAlign: 'center', background: 'var(--light)', color: 'var(--text-primary-light)' }}>
        <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>{isBanned ? '🚫' : '⏳'}</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>
          {isBanned ? 'Compte Banni Définitivement' : 'Compte Suspendu Temporairement'}
        </h1>
        <p style={{ maxWidth: '500px', marginTop: '1rem', color: 'var(--text-secondary-light)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          {isBanned ? (
            `Votre compte a été banni définitivement par l'administration de Sunu Yité. Motif : ${blockReasonText}`
          ) : (
            `Votre compte a été suspendu par l'administration jusqu'au ${suspensionEndDate?.toLocaleString('fr-FR')}. Motif : ${blockReasonText}`
          )}
        </p>
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '2rem', padding: '0.6rem 2rem', fontSize: '0.9rem' }} 
          onClick={() => logout()}
        >
          Se déconnecter
        </button>
      </div>
    );
  }

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
            background: 'radial-gradient(circle at center, #0B4A7A 0%, #051D33 70%, #020C17 100%)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: showSplashScreen ? 1 : 0,
            pointerEvents: showSplashScreen ? 'auto' : 'none',
            overflow: 'hidden'
          }}
        >
          {/* Sparkles Canvas overlay */}
          <canvas 
            ref={canvasRef} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />

          {/* Custom Splash Animations */}
          <style>{`
            @keyframes logoFloatPulse {
              0% { transform: scale(1) translateY(0px); filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
              50% { transform: scale(1.05) translateY(-6px); filter: drop-shadow(0 12px 25px rgba(0,133,63,0.35)); }
              100% { transform: scale(1) translateY(0px); filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
            }
            @keyframes spinSenegal {
              0% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(180deg) scale(1.03); }
              100% { transform: rotate(360deg) scale(1); }
            }
            @keyframes logoSpin3D {
              0% { transform: rotateY(0deg) scale(1); }
              100% { transform: rotateY(360deg) scale(1); }
            }
            .logo-spin-active {
              animation: logoSpin3D 1s cubic-bezier(0.25, 1, 0.5, 1) !important;
            }
            @keyframes glowPulse {
              0% { opacity: 0.4; transform: scale(0.9); }
              50% { opacity: 0.7; transform: scale(1.1); }
              100% { opacity: 0.4; transform: scale(0.9); }
            }
            @keyframes shimmerEffect {
              0% { background-position: 0% center; }
              100% { background-position: -200% center; }
            }
            @keyframes fadeInText {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes scalePop {
              0% { transform: scale(0.6) translateY(12px); opacity: 0; }
              100% { transform: scale(1) translateY(0); opacity: 1; }
            }
            .shimmer-title {
              background: linear-gradient(90deg, #ffffff 0%, #FDB913 25%, #ffffff 50%, #FDB913 75%, #ffffff 100%);
              background-size: 200% auto;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              animation: shimmerEffect 4s linear infinite;
              text-shadow: 0 4px 12px rgba(0,0,0,0.25);
            }
            .splash-fade-in {
              animation: fadeInText 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .scale-pop {
              animation: scalePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
          `}</style>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem', textAlign: 'center', padding: '2rem', position: 'relative', zIndex: 2 }}>
            {/* Animated Glow Aura */}
            <div style={{
              position: 'absolute',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(253,185,19,0.12) 0%, rgba(0,133,63,0.04) 50%, transparent 70%)',
              filter: 'blur(25px)',
              animation: 'glowPulse 4s ease-in-out infinite',
              zIndex: -1,
              top: '10%'
            }} />

            {/* Logo, Speech Bubble, and Tricolor ring */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '160px', height: '160px' }}>
              
              {/* Humorist Lion Speech Bubble */}
              {lionSpeechBubble && (
                <div 
                  key={lionSpeechBubble}
                  className="scale-pop"
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    marginBottom: '16px',
                    background: 'rgba(15, 32, 53, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(253, 185, 19, 0.6)',
                    borderRadius: '16px',
                    padding: '8px 16px',
                    color: 'white',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                    zIndex: 10,
                    width: '220px',
                    textAlign: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  {lionSpeechBubble}
                  {/* Bubble Tail */}
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: '10px',
                      height: '10px',
                      background: 'rgba(15, 32, 53, 0.85)',
                      borderRight: '1.5px solid rgba(253, 185, 19, 0.6)',
                      borderBottom: '1.5px solid rgba(253, 185, 19, 0.6)'
                    }}
                  />
                </div>
              )}

              {/* Tricolor ring */}
              <div 
                style={{
                  position: 'absolute',
                  width: '146px',
                  height: '146px',
                  borderRadius: '50%',
                  border: '4px solid rgba(255,255,255,0.03)',
                  borderTop: '4px solid #00853F',
                  borderRight: '4px solid #FDB913',
                  borderBottom: '4px solid #E31B23',
                  borderLeft: '4px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 0 20px rgba(253, 185, 19, 0.15), inset 0 0 10px rgba(0,133,63,0.05)',
                  animation: 'spinSenegal 2.4s cubic-bezier(0.4, 0.1, 0.4, 0.9) infinite'
                }}
              />
              <div
                onMouseEnter={handleLogoHover}
                onClick={handleLogoHover as any}
                className={isLogoSpinning ? 'logo-spin-active' : ''}
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 2,
                  animation: isLogoSpinning ? '' : 'logoFloatPulse 3s ease-in-out infinite',
                  transition: 'transform 0.2s ease'
                }}
              >
                <img 
                  src="/logo.png" 
                  alt="Sunu Yité Logo" 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'contain',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    pointerEvents: 'none'
                  }}
                />
              </div>
            </div>
            
            {/* Brand Titles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <h1 className="shimmer-title" style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
                Sunu Yité
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
                {t('splash.title')}
              </p>
            </div>
            
            {/* Progress Bar Container */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '260px' }}>
              <div style={{
                width: '100%',
                height: '5px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.03)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)'
              }}>
                <div 
                  style={{ 
                    width: `${
                      splashText === 'Connexion à la base de données...' ? 10 :
                      splashText === 'Sécurisation de la connexion...' ? 20 :
                      splashText === 'Chargement des cagnottes solidaires...' ? 30 :
                      splashText === 'Récupération des pétitions citoyennes...' ? 40 :
                      splashText === 'Synchronisation des tontines...' ? 50 :
                      splashText === 'Vérification des nouveaux lancements...' ? 60 :
                      splashText === 'Chargement des missions de bénévolat...' ? 70 :
                      splashText === 'Synchronisation du fil d\'actualités...' ? 80 :
                      splashText === 'Optimisation du cache local de l\'application...' ? 90 :
                      splashText === 'Préparation de votre espace Sunu Yité...' ? 95 : 100
                    }%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #00853F, #FDB913, #E31B23)', 
                    borderRadius: '3px',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 10px rgba(253,185,19,0.4)'
                  }} 
                />
              </div>
              
              {/* Animated text labels */}
              <p 
                key={splashText}
                className="splash-fade-in"
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  fontWeight: 500,
                  marginTop: '0.75rem',
                  letterSpacing: '0.2px'
                }}
              >
                {splashText}
              </p>
            </div>

            {/* Proverbs & Trivia Slideshow Card */}
            <div 
              className="glass"
              style={{
                marginTop: '0.5rem',
                maxWidth: '350px',
                width: '100%',
                borderRadius: '16px',
                padding: '1.25rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1.5px solid rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                minHeight: '140px',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Watermark flag background */}
              <div style={{
                position: 'absolute',
                right: '-15px',
                bottom: '-15px',
                fontSize: '5rem',
                opacity: 0.06,
                userSelect: 'none',
                pointerEvents: 'none'
              }}>
                🇸🇳
              </div>

              <div 
                key={triviaIndex} 
                style={{ 
                  animation: 'fadeInText 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  textAlign: 'left'
                }}
              >
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#FDB913', 
                  fontWeight: 800, 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  {triviaSlides[triviaIndex].type === 'proverb' ? '💬' : '💡'} {triviaSlides[triviaIndex].title}
                </span>
                
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.92rem', 
                  fontWeight: 800, 
                  lineHeight: 1.45,
                  color: '#ffffff'
                }}>
                  {triviaSlides[triviaIndex].text}
                </p>
                
                {triviaSlides[triviaIndex].translation && (
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.82rem', 
                    color: '#cbd5e1', 
                    fontStyle: 'italic',
                    borderLeft: '3px solid #00853F',
                    paddingLeft: '8px',
                    marginTop: '0.1rem'
                  }}>
                    {triviaSlides[triviaIndex].translation}
                  </p>
                )}
                
                {triviaSlides[triviaIndex].meaning && (
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.72rem', 
                    color: '#94a3b8',
                    fontWeight: 600,
                    marginTop: '0.2rem'
                  }}>
                    Signification : {triviaSlides[triviaIndex].meaning}
                  </p>
                )}
              </div>
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
                {t('nav.home')}
              </button>
              <button 
                className={`btn ${currentPage === 'petitions' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('petitions')}
              >
                {t('nav.petitions')}
              </button>
              <button 
                className={`btn ${currentPage === 'cagnottes' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('cagnottes')}
              >
                {t('nav.cagnottes')}
              </button>
              <button 
                className={`btn ${currentPage === 'benevolat' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('benevolat')}
              >
                {t('nav.benevolat')}
              </button>
              <button 
                className={`btn ${currentPage === 'tontines' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('tontines')}
              >
                {t('nav.tontines')}
              </button>
              <button 
                className={`btn ${currentPage === 'diaspora' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                onClick={() => handleNavigate('diaspora')}
              >
                {t('nav.diaspora')}
              </button>
              
              {/* Quick toggle check for Admin roles */}
              {currentUser?.role === 'admin' && (
                <button 
                  className={`btn ${currentPage === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', color: 'var(--warning)', fontWeight: 'bold' }}
                  onClick={() => handleNavigate('admin')}
                >
                  {t('nav.admin')}
                </button>
              )}
            </nav>
          )}

          {/* Action Toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            
            {/* Language Selector */}
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-light)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              {(['fr', 'wo', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: language === lang ? 'var(--primary)' : 'transparent',
                    color: language === lang ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={lang === 'fr' ? 'Français' : lang === 'wo' ? 'Wolof' : 'English'}
                >
                  {lang === 'fr' ? '🇫🇷' : lang === 'wo' ? '🇸🇳' : '🇬🇧'}
                </button>
              ))}
            </div>

            {/* Theme selector */}
            <button 
              className="btn btn-ghost" 
              style={{ padding: '0.5rem', minWidth: 'auto' }}
              onClick={toggleTheme}
            >
              {activeTheme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Profile Avatar & Connexion/Déconnexion click */}
            {!isMobileView && (
              currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Messages Button with badge */}
                  <button
                    className="btn btn-ghost"
                    style={{
                      padding: '0.5rem',
                      minWidth: 'auto',
                      position: 'relative',
                      fontSize: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-primary-light)'
                    }}
                    onClick={() => handleNavigate('messages')}
                    title="Messages"
                  >
                    ✉️
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          background: 'var(--danger, #ef4444)',
                          color: 'white',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 0 2px var(--bg-card, #ffffff)'
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </button>

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
              onOpenFooterModal={(modal) => setActiveModal(modal)}
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
              <a href="#charte" onClick={(e) => { e.preventDefault(); setActiveModal('charte'); }}>Charte de confiance</a>
              <a href="#mentions" onClick={(e) => { e.preventDefault(); setActiveModal('mentions'); }}>Mentions légales</a>
              <a href="#support" onClick={(e) => { e.preventDefault(); setActiveModal('support'); }}>Contact & Support</a>
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

      {/* FOOTER MODALS */}
      {activeModal === 'charte' && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="glass animate-fade-in"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 2rem',
              border: '1.5px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
              onClick={() => setActiveModal(null)}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '3rem' }}>📜</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary-light)' }}>
                Charte de Confiance
              </h2>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Sunu Yité — Engagement pour la transparence et l'intégrité
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary-light)', lineHeight: 1.6 }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔍</span> 1. Vérification d'Identité Strict (KYC)
                </h3>
                <p>
                  Pour garantir l'intégrité des causes lancées sur Sunu Yité, chaque organisateur de cagnotte ou de pétition doit soumettre une vérification d'identité officielle (CNI ou Passeport recto-verso accompagnée d'un selfie de contrôle). Aucun fonds ne peut être collecté ou retiré sans cette certification d'identité complète.
                </p>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔒</span> 2. Sécurisation Financière et Comptes Séquestres
                </h3>
                <p>
                  Tous les dons effectués sur Sunu Yité transitent via des prestataires de paiement certifiés et sécurisés (Stripe, Wave, Orange Money). Les fonds sont conservés sur un compte séquestre dédié et ne sont reversés qu'après validation de l'identité et vérification de la légitimité du projet par nos administrateurs.
                </p>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📊</span> 3. Transparence Totale des Dépenses
                </h3>
                <p>
                  Chaque cagnotte dispose d'un espace "Transparence" obligatoire. L'organisateur s'engage à y publier chaque facture d'achat, reçu de paiement et photographie des travaux ou livrables. Les donateurs (notamment la diaspora) ont un droit de regard permanent sur le solde de la cagnotte et l'utilisation de chaque centime.
                </p>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏅</span> 4. Score de Confiance (Trust Score)
                </h3>
                <p>
                  Notre algorithme attribue à chaque citoyen ou association un score de confiance (de 0 à 100) basé sur l'ancienneté du profil, la réussite de ses causes passées, et l'exactitude des justificatifs de dépenses fournis. Un score élevé est le garant d'un engagement citoyen sérieux et vérifié.
                </p>
              </div>

              <div>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔄</span> 5. Tontines Citoyennes Encadrées
                </h3>
                <p>
                  Les cercles d'épargne (tontines) reposent sur des règles de rotation strictes appliquées par notre contrat intelligent simulé. Les membres s'engagent à respecter l'ordre des versements sous peine d'exclusion et de dégradation de leur score de confiance civique global.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setActiveModal(null)}
                style={{ padding: '0.6rem 2rem' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'mentions' && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="glass animate-fade-in"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 2rem',
              border: '1.5px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
              onClick={() => setActiveModal(null)}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '3rem' }}>⚖️</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary-light)' }}>
                Mentions Légales
              </h2>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Conformément à la réglementation sénégalaise et internationale
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary-light)', lineHeight: 1.6 }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem' }}>
                  1. Éditeur de la Plateforme
                </h3>
                <p>
                  Sunu Yité est éditée par le Collectif pour l'Impact et la Mobilisation Citoyenne au Sénégal.<br />
                  <strong>Siège social :</strong> Keur Serigne Louga / En face keur thierno Mountaga TALL / Louga / Sénégal.<br />
                  <strong>Contact :</strong> contact@sunuyite.sn / +221 76 016 76 76
                </p>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem' }}>
                  2. Responsable de la Publication
                </h3>
                <p>
                  Le directeur de la publication et responsable du contenu éditorial de la plateforme est <strong>Mouhameth Sarr</strong>.
                </p>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem' }}>
                  3. Hébergement du site
                </h3>
                <p>
                  Cette application Web et ses serveurs serverless sont hébergés par :<br />
                  <strong>Hébergeur :</strong> Vercel Inc.<br />
                  <strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.<br />
                  <strong>Site Web :</strong> vercel.com
                </p>
              </div>

              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem' }}>
                  4. Protection des Données Personnelles (CDP)
                </h3>
                <p>
                  Conformément aux directives de la Commission de Protection des Données Personnelles (CDP) du Sénégal, les informations nominatives collectées (adresses e-mail, numéros de téléphone pour OTP SMS, pièces d'identité) sont cryptées et stockées de manière hautement sécurisée dans notre base de données Supabase. Vous disposez d'un droit d'accès, de modification et de suppression de vos données depuis l'onglet "Profil".
                </p>
              </div>

              <div>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem' }}>
                  5. Propriété Intellectuelle
                </h3>
                <p>
                  La marque Sunu Yité, son logo, le design du tableau de bord de confiance et le code source de l'application sont protégés par le droit d'auteur. Toute reproduction ou utilisation non autorisée fera l'objet de poursuites.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => setActiveModal(null)}
                style={{ padding: '0.6rem 2rem' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'support' && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setActiveModal(null)}
        >
          <div 
            className="glass animate-fade-in"
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 2rem',
              border: '1.5px solid var(--border-light)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
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
              onClick={() => setActiveModal(null)}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '3rem' }}>🤝</span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-primary-light)' }}>
                Contact & Support Client
              </h2>
              <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Comment pouvons-nous vous aider aujourd'hui ?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary-light)', lineHeight: 1.6 }}>
              <div>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '0.25rem' }}>
                  💡 Foire Aux Questions (FAQ)
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary-light)', display: 'block' }}>• Quels sont les frais prélevés par Sunu Yité ?</strong>
                    <span style={{ fontSize: '0.85rem' }}>La plateforme est 100% gratuite pour les causes citoyennes. Aucun frais de gestion n'est appliqué. Seuls les frais de réseau réglementaires des opérateurs de mobile money (Wave, Orange Money) sont déduits au moment du transfert.</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary-light)', display: 'block' }}>• Combien de temps prend la validation d'une campagne ?</strong>
                    <span style={{ fontSize: '0.85rem' }}>Une fois votre CNI et les détails du projet soumis, nos modérateurs valident la campagne sous 12 à 24 heures pour s'assurer de sa conformité avec notre charte éthique.</span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary-light)', display: 'block' }}>• Les contributions de la diaspora sont-elles autorisées ?</strong>
                    <span style={{ fontSize: '0.85rem' }}>Oui, absolument. Les cagnottes étiquetées "Diaspora" permettent aux Sénégalais résidant à l'étranger de parrainer directement le projet par Carte Bancaire (via Stripe) ou virement international.</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontWeight: 800, color: 'var(--text-primary-light)', marginBottom: '0.5rem' }}>
                  📞 Nous joindre directement
                </h3>
                <p>
                  Notre équipe de modérateurs et de coordinateurs projets est à votre service :
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', background: 'var(--light)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div>📧 <strong>E-mail Support :</strong> support@sunuyite.sn</div>
                  <div>📧 <strong>Administrateur :</strong> admin@sunuyite.sn</div>
                  <div>💬 <strong>WhatsApp & Téléphone :</strong> +221 76 016 76 76</div>
                  <div>📍 <strong>Adresse Bureau :</strong> Keur Serigne Louga / En face keur thierno Mountaga TALL / Louga / Sénégal</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                  Vous préférez nous soumettre un ticket ou une question en ligne ?
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={(e) => {
                    setActiveModal(null);
                    scrollToContact(e);
                  }}
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
                >
                  Ouvrir le formulaire de contact ✉️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PUBLIC PROFILE MODAL */}
      <PublicProfileModal onNavigate={handleNavigate} />

    </div>
  );
};
export const App: React.FC = () => {
  return (
    <AppProvider>
      <LanguageProvider>
        <MainLayout />
      </LanguageProvider>
    </AppProvider>
  );
};

export default App;

