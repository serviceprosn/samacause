import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Petition, Cagnotte, VolunteerMission, VolunteerApplication, Badge, ChatMessage, AdminKPIs, Update, Expense, DirectMessage } from '../types';
import { supabase } from '../services/supabaseClient';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, phone: string, pass: string, country: string, region: string, accountType?: 'citizen' | 'company' | 'ngo') => Promise<{ success: boolean; needsConfirmation: boolean }>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
  useSupabase: boolean;
  usersList: User[];
  petitions: Petition[];
  cagnottes: Cagnotte[];
  volunteerMissions: VolunteerMission[];
  volunteerApplications: VolunteerApplication[];
  badges: Badge[];
  activeTheme: 'light' | 'dark';
  toggleTheme: () => void;
  isMobileView: boolean;
  setIsMobileView: (val: boolean) => void;
  notifications: string[];
  addNotification: (msg: string) => void;
  
  // Public Profile Viewer & Chat system between users
  selectedPublicUserId: string | null;
  setSelectedPublicUserId: (userId: string | null) => void;
  directMessages: DirectMessage[];
  activeChatUserId: string | null;
  setActiveChatUserId: (userId: string | null) => void;
  sendDirectMessage: (receiverId: string, text: string) => void;
  adminUpdateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  followUser: (userId: string) => Promise<boolean>;
  unfollowUser: (userId: string) => Promise<boolean>;

  // Actions
  updateProfile: (
    name: string, 
    phone: string, 
    avatar: string, 
    bio?: string, 
    address?: string, 
    country?: string, 
    region?: string,
    idCardRecto?: string,
    idCardVerso?: string,
    selfie?: string,
    verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected',
    cniNumber?: string,
    dob?: string
  ) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  isProfileComplete: (user: User | null) => boolean;
  isBasicProfileComplete: (user: User | null) => boolean;
  signPetition: (id: string, name: string, email: string, phone: string) => Promise<boolean>;
  boostPetition: (id: string, boostLevel: 'ndamel' | 'teranga' | 'lion', amount: number, paymentMethod: string) => Promise<boolean>;
  donateToCagnotte: (id: string, amount: number, name: string, comment: string, isDiaspora: boolean, paymentMethod: string) => Promise<boolean>;
  applyToMission: (id: string, name: string, email: string, phone: string, message: string) => Promise<boolean>;
  createPetition: (petition: Omit<Petition, 'id' | 'signaturesCount' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'signers'>) => string;
  createCagnotte: (cagnotte: Omit<Cagnotte, 'id' | 'amountCollected' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'expenses' | 'donors'>) => string;
  createVolunteerMission: (mission: Omit<VolunteerMission, 'id' | 'volunteersCount' | 'createdAt' | 'organizer' | 'status'>) => void;
  
  // Admin & Organizer actions
  approveCampaign: (id: string, type: 'petition' | 'cagnotte') => void;
  rejectCampaign: (id: string, type: 'petition' | 'cagnotte', feedback: string) => void;
  markCampaignAsViewed: (id: string, type: 'petition' | 'cagnotte') => void;
  resubmitCampaign: (
    id: string, 
    type: 'petition' | 'cagnotte', 
    title: string, 
    description: string, 
    targetValue?: number,
    location?: string,
    coverImage?: string,
    recipient?: string,
    isDiasporaTargeted?: boolean,
    documents?: string[],
    gallery?: string[]
  ) => void;
  addCampaignUpdate: (id: string, type: 'petition' | 'cagnotte', title: string, content: string) => void;
  addCampaignExpense: (cagnotteId: string, desc: string, amount: number, category: string) => void;
  
  // IA actions
  chatHistory: ChatMessage[];
  sendIAMessage: (text: string, campaignType: 'petition' | 'cagnotte' | 'both', tone: string) => void;
  clearChat: () => void;
  
  // KPIs
  getKPIs: () => AdminKPIs;
  
  // OTP simulation
  activeOtpCode: string | null;
  sendOtpSms: (phone: string) => void;
  verifyOtp: (code: string) => boolean;

  // PWA Install
  isInstallable: boolean;
  installApp: () => Promise<boolean>;
}

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'mouhamethsarr98@gmail.com';

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialBadges: Badge[] = [
  { id: 'citoyen', name: 'Citoyen', description: 'Signer sa première pétition pour faire entendre sa voix.', icon: '✍️', category: 'Citoyen' },
  { id: 'bienfaiteur', name: 'Bienfaiteur', description: 'Contribuer financièrement à une cause solidaire.', icon: '❤️', category: 'Bienfaiteur' },
  { id: 'ambassadeur', name: 'Ambassadeur', description: 'Partager des pétitions ou cagnottes pour amplifier l\'impact.', icon: '📢', category: 'Ambassadeur' },
  { id: 'batisseur', name: 'Bâtisseur', description: 'Rejoindre et accomplir au moins une mission de bénévolat.', icon: '🛠️', category: 'Bâtisseur' },
  { id: 'leader', name: 'Leader', description: 'Créer et lancer sa propre campagne sur la plateforme.', icon: '👑', category: 'Leader' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [useSupabase, setUseSupabase] = useState(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(
      url && 
      url !== 'https://votre-projet.supabase.co' &&
      anonKey && 
      anonKey !== 'votre-cle-api-anon' && 
      anonKey !== 'votre-cle-api-anon-ici'
    );
  });
  
  // Public Profile and Direct Message States
  const [selectedPublicUserId, setSelectedPublicUserId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('sc_direct_messages');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('sc_direct_messages', JSON.stringify(directMessages));
    } catch (e) {
      console.error("Failed to save direct messages to storage:", e);
    }
  }, [directMessages]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const rememberMe = localStorage.getItem('sc_remember_me') !== 'false';
    if (rememberMe) {
      const saved = localStorage.getItem('sc_current_user');
      return saved ? JSON.parse(saved) : null;
    } else {
      const saved = sessionStorage.getItem('sc_current_user');
      return saved ? JSON.parse(saved) : null;
    }
  });

  // Synchronize currentUser changes to localStorage/sessionStorage for instant load on reload
  useEffect(() => {
    if (currentUser) {
      const rememberMe = localStorage.getItem('sc_remember_me') !== 'false';
      if (rememberMe) {
        localStorage.setItem('sc_current_user', JSON.stringify(currentUser));
        sessionStorage.removeItem('sc_current_user');
      } else {
        sessionStorage.setItem('sc_current_user', JSON.stringify(currentUser));
        localStorage.removeItem('sc_current_user');
      }
    } else {
      localStorage.removeItem('sc_current_user');
      sessionStorage.removeItem('sc_current_user');
    }
  }, [currentUser]);

  const [usersList, setUsersList] = useState<User[]>(() => {
    const saved = localStorage.getItem('sc_users_list');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    return [
      {
        id: 'usr_ong_teranga',
        name: 'ONG Action Teranga 🇸🇳',
        email: 'contact@actionteranga.org',
        phone: '+221 33 822 10 10',
        role: 'citizen',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?w=150&fit=crop&q=80',
        trustScore: 95,
        badges: ['leader', 'bienfaiteur'],
        country: 'Sénégal',
        region: 'Dakar',
        verificationStatus: 'verified',
        accountType: 'ngo',
        following: [],
        followers: []
      },
      {
        id: 'usr_ent_progres',
        name: 'Sénégal Progrès S.A. 📈',
        email: 'info@senegalprogres.sn',
        phone: '+221 33 845 20 20',
        role: 'citizen',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&fit=crop&q=80',
        trustScore: 90,
        badges: ['bienfaiteur'],
        country: 'Sénégal',
        region: 'Dakar',
        verificationStatus: 'verified',
        accountType: 'company',
        following: [],
        followers: []
      },
      {
        id: 'usr_cit_amady',
        name: 'Amady Ndiaye 🦁',
        email: 'amady@ndiaye.sn',
        phone: '+221 77 555 44 33',
        role: 'citizen',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&fit=crop&q=80',
        trustScore: 98,
        badges: ['leader', 'citoyen', 'ambassadeur'],
        country: 'Sénégal',
        region: 'Louga',
        verificationStatus: 'verified',
        accountType: 'citizen',
        following: [],
        followers: []
      }
    ];
  });

  const [petitions, setPetitions] = useState<Petition[]>(() => {
    const saved = localStorage.getItem('sc_petitions');
    return saved ? JSON.parse(saved) : [];
  });

  const [cagnottes, setCagnottes] = useState<Cagnotte[]>(() => {
    const saved = localStorage.getItem('sc_cagnottes');
    return saved ? JSON.parse(saved) : [];
  });

  const [volunteerMissions, setVolunteerMissions] = useState<VolunteerMission[]>(() => {
    const saved = localStorage.getItem('sc_volunteer_missions');
    return saved ? JSON.parse(saved) : [];
  });

  const [volunteerApplications, setVolunteerApplications] = useState<VolunteerApplication[]>(() => {
    const saved = localStorage.getItem('sc_volunteer_applications');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sc_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });
  const [notifications, setNotifications] = useState<string[]>([]);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);

  // PWA Install prompt state & listener
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    // If PWA is already installed and running in standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('No PWA install prompt available.');
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to PWA install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  };

  // IA Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('sc_chat_history');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'msg_welcome',
        sender: 'ia',
        text: 'Sénégal Sunu Yité Assistant IA 👋 ! Je peux vous aider à rédiger le titre, la description, les messages de partage WhatsApp, Facebook et concevoir une affiche publicitaire pour votre pétition ou cagnotte. Que souhaitez-vous mobiliser aujourd\'hui ?',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Créer un forage à Barkedji',
          'Soutenir une maternité locale',
          'Acheter des fournitures scolaires pour mon village'
        ]
      }
    ];
  });

  // DETECT AND CONNECT SUPABASE
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const isConfigured = 
      url && 
      url !== 'https://votre-projet.supabase.co' &&
      anonKey && 
      anonKey !== 'votre-cle-api-anon' && 
      anonKey !== 'votre-cle-api-anon-ici';
    
    setUseSupabase(!!isConfigured);
    
    if (isConfigured) {
      console.log('🔌 Connexion active à Supabase détectée !');
      
      const loadPetitions = async () => {
        const { data, error } = await supabase
          .from('petitions')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setPetitions(data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            coverImage: item.cover_image,
            category: item.category,
            signaturesCount: item.signatures_count,
            signaturesTarget: item.signatures_target,
            recipient: item.recipient,
            location: item.location,
            dateLimit: item.date_limit,
            createdAt: item.created_at,
            status: item.status,
            organizer: item.organizer,
            updates: item.updates || [],
            signers: item.signers || [],
            boosted: item.boosted,
            boostLevel: item.boost_level,
            viewedByAdmin: item.viewed_by_admin,
            rejectionFeedback: item.rejection_feedback
          })));
        }
      };

      const loadCagnottes = async () => {
        const { data, error } = await supabase
          .from('cagnottes')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setCagnottes(data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            coverImage: item.cover_image,
            category: item.category,
            amountCollected: Number(item.amount_collected || 0),
            amountTarget: Number(item.amount_target || 0),
            location: item.location,
            createdAt: item.created_at,
            status: item.status,
            organizer: item.organizer,
            isDiasporaTargeted: item.is_diaspora_targeted,
            updates: item.updates || [],
            expenses: item.expenses || [],
            donors: item.donors || [],
            documents: item.documents || [],
            gallery: item.gallery || [],
            viewedByAdmin: item.viewed_by_admin,
            rejectionFeedback: item.rejection_feedback
          })));
        }
      };

      const loadProfiles = async () => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (!error && data) {
          setUsersList(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone || '',
            role: p.role || 'citizen',
            verified: p.verified || false,
            avatar: p.avatar || '',
            trustScore: p.trust_score || 50,
            badges: p.badges || [],
            bio: p.bio,
            address: p.address,
            country: p.country,
            region: p.region,
            idCardRecto: p.id_card_recto,
            idCardVerso: p.id_card_verso,
            selfie: p.selfie,
            verificationStatus: p.verification_status || 'none',
            cniNumber: p.cni_number,
            dob: p.dob
          })));
        }
      };

      loadPetitions();
      loadCagnottes();
      loadProfiles();

      // Realtime subscriptions
      const petitionsSub = supabase
        .channel('realtime:petitions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'petitions' }, () => {
          loadPetitions();
        })
        .subscribe();

      const cagnottesSub = supabase
        .channel('realtime:cagnottes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cagnottes' }, () => {
          loadCagnottes();
        })
        .subscribe();

      const profilesSub = supabase
        .channel('realtime:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          loadProfiles();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(petitionsSub);
        supabase.removeChannel(cagnottesSub);
        supabase.removeChannel(profilesSub);
      };
    }
  }, []);

  // Listen to Supabase Auth State changes for secure session recovery
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const isConfigured = 
      url && 
      url !== 'https://votre-projet.supabase.co' &&
      anonKey && 
      anonKey !== 'votre-cle-api-anon' && 
      anonKey !== 'votre-cle-api-anon-ici';

    if (isConfigured) {
      const syncUserSession = async (session: any) => {
        if (session && session.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            let matchedUser: User;
            if (profile) {
              matchedUser = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone || '',
                role: (profile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? 'admin' : (profile.role || 'citizen'),
                verified: profile.verified || false,
                avatar: profile.avatar || '',
                trustScore: profile.trust_score || 50,
                badges: profile.badges || [],
                bio: profile.bio,
                address: profile.address,
                country: profile.country,
                region: profile.region,
                idCardRecto: profile.id_card_recto,
                idCardVerso: profile.id_card_verso,
                selfie: profile.selfie,
                verificationStatus: profile.verification_status || 'none',
                cniNumber: profile.cni_number,
                dob: profile.dob,
                following: profile.following || [],
                followers: profile.followers || []
              };
            } else {
              console.warn("⚠️ Profil de session introuvable. Création d'un profil de secours...");
              const u = session.user;
              const isSessionAdmin = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
              const fallbackProfile = {
                id: u.id,
                name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Citoyen',
                email: u.email || '',
                phone: u.user_metadata?.phone || '',
                role: isSessionAdmin ? 'admin' : (u.user_metadata?.role || 'citizen'),
                verified: isSessionAdmin ? true : false,
                trust_score: isSessionAdmin ? 100 : 50,
                avatar: u.user_metadata?.avatar_url || u.user_metadata?.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==',
                country: u.user_metadata?.country || 'Sénégal',
                region: u.user_metadata?.region || 'Dakar',
                verification_status: isSessionAdmin ? 'verified' : 'none'
              };

              const { error: insertError } = await supabase.from('profiles').insert([fallbackProfile]);
              if (insertError) {
                console.error("Erreur lors de la création directe du profil de secours :", insertError);
              }

              matchedUser = {
                id: fallbackProfile.id,
                name: fallbackProfile.name,
                email: fallbackProfile.email,
                phone: fallbackProfile.phone,
                role: fallbackProfile.role as 'citizen' | 'organizer' | 'admin',
                verified: fallbackProfile.verified,
                avatar: fallbackProfile.avatar,
                trustScore: fallbackProfile.trust_score,
                badges: [],
                country: fallbackProfile.country,
                region: fallbackProfile.region,
                verificationStatus: fallbackProfile.verification_status as 'none' | 'pending' | 'verified' | 'rejected',
                following: [],
                followers: []
              };
            }
            setCurrentUser(matchedUser);
          } catch (err) {
            console.error("Erreur lors de la synchronisation de la session :", err);
          }
        } else {
          setCurrentUser(null);
        }
      };

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        syncUserSession(session);
      });

      // Listen for auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        syncUserSession(session);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [useSupabase]);

  // Apply dark mode on document load/toggle
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('sc_theme', activeTheme);
  }, [activeTheme]);

  // Track resizing to automatically switch shell on mobile/tablet screens
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync to storage depending on rememberMe preference
  useEffect(() => {
    const rememberMe = localStorage.getItem('sc_remember_me') !== 'false';
    if (currentUser) {
      // Clean large image fields before serializing to prevent QuotaExceededError in localStorage
      const cleanUser = {
        ...currentUser,
        idCardRecto: currentUser.idCardRecto && currentUser.idCardRecto.startsWith('data:') ? '[stored]' : currentUser.idCardRecto,
        idCardVerso: currentUser.idCardVerso && currentUser.idCardVerso.startsWith('data:') ? '[stored]' : currentUser.idCardVerso,
        selfie: currentUser.selfie && currentUser.selfie.startsWith('data:') ? '[stored]' : currentUser.selfie,
      };

      try {
        if (rememberMe) {
          localStorage.setItem('sc_current_user', JSON.stringify(cleanUser));
          sessionStorage.removeItem('sc_current_user');
        } else {
          sessionStorage.setItem('sc_current_user', JSON.stringify(cleanUser));
          localStorage.removeItem('sc_current_user');
        }
      } catch (e) {
        console.error("Failed to save user to storage (quota exceeded or storage disabled):", e);
      }
    } else {
      try {
        localStorage.removeItem('sc_current_user');
        sessionStorage.removeItem('sc_current_user');
      } catch (e) {
        console.error("Failed to remove user from storage:", e);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (!useSupabase) {
      try {
        // Strip large images from users list for localStorage if any exist
        const cleanUsersList = usersList.map(u => ({
          ...u,
          idCardRecto: u.idCardRecto && u.idCardRecto.startsWith('data:') ? '[stored]' : u.idCardRecto,
          idCardVerso: u.idCardVerso && u.idCardVerso.startsWith('data:') ? '[stored]' : u.idCardVerso,
          selfie: u.selfie && u.selfie.startsWith('data:') ? '[stored]' : u.selfie,
        }));
        localStorage.setItem('sc_users_list', JSON.stringify(cleanUsersList));
      } catch (e) {
        console.error("Failed to save users list to storage:", e);
      }
    }
  }, [usersList, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      try {
        localStorage.setItem('sc_petitions', JSON.stringify(petitions));
      } catch (e) {
        console.error("Failed to save petitions to storage:", e);
      }
    }
  }, [petitions, useSupabase]);

  useEffect(() => {
    if (!useSupabase) {
      try {
        localStorage.setItem('sc_cagnottes', JSON.stringify(cagnottes));
      } catch (e) {
        console.error("Failed to save cagnottes to storage:", e);
      }
    }
  }, [cagnottes, useSupabase]);

  useEffect(() => {
    try {
      localStorage.setItem('sc_volunteer_missions', JSON.stringify(volunteerMissions));
    } catch (e) {
      console.error("Failed to save volunteer missions to storage:", e);
    }
  }, [volunteerMissions]);

  useEffect(() => {
    try {
      localStorage.setItem('sc_volunteer_applications', JSON.stringify(volunteerApplications));
    } catch (e) {
      console.error("Failed to save volunteer applications to storage:", e);
    }
  }, [volunteerApplications]);

  useEffect(() => {
    try {
      localStorage.setItem('sc_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
      console.error("Failed to save chat history to storage:", e);
    }
  }, [chatHistory]);

  const toggleTheme = () => {
    setActiveTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications(prev => {
        const next = [...prev];
        const idx = next.indexOf(msg);
        if (idx > -1) {
          next.splice(idx, 1);
        }
        return next;
      });
    }, 4000);
  };

  const triggerPushNotification = (title: string, body: string) => {
    addNotification(`🔔 ${title} : ${body}`);
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'sunu-yite-notif'
          });
        } catch (err) {
          console.warn("Direct Notification constructor failed, falling back to Service Worker...", err);
          if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, {
                body,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'sunu-yite-notif'
              });
            });
          }
        }
      }
    }
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // OTP SIMULATION
  const sendOtpSms = (phone: string) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setActiveOtpCode(code);
    addNotification(`[MOCK SMS] OTP envoyé au ${phone} : ${code}`);
    console.log(`[MOCK OTP SMS] Code envoyé : ${code}`);
  };

  const verifyOtp = (code: string) => {
    if (code === activeOtpCode) {
      setActiveOtpCode(null);
      return true;
    }
    return false;
  };

  // ACTIONS
  const signPetition = async (id: string, name: string, email: string, phone: string): Promise<boolean> => {
    // Add signer to list
    setPetitions(prev => prev.map(pet => {
      if (pet.id === id) {
        // Prevent double signatures by same name in this mock
        const alreadySigned = pet.signers.some(s => s.name.toLowerCase() === name.toLowerCase());
        if (alreadySigned) return pet;

        return {
          ...pet,
          signaturesCount: pet.signaturesCount + 1,
          signers: [{ name, date: new Date().toISOString().split('T')[0], badge: 'Citoyen' }, ...pet.signers]
        };
      }
      return pet;
    }));

    if (useSupabase) {
      const pet = petitions.find(p => p.id === id);
      if (pet) {
        const alreadySigned = pet.signers.some(s => s.name.toLowerCase() === name.toLowerCase());
        if (!alreadySigned) {
          const newSigner = { name, date: new Date().toISOString().split('T')[0], badge: 'Citoyen' };
          const updatedSigners = [newSigner, ...pet.signers];
          
          supabase.from('petitions').update({
            signatures_count: pet.signaturesCount + 1,
            signers: updatedSigners
          }).eq('id', id).then(({ error }) => {
            if (error) console.error("Error signing in Supabase: ", error);
          });
        }
      }
    }

    // Unlock "Citoyen" badge for current user if it is them signing
    if (currentUser && name.toLowerCase() === currentUser.name.toLowerCase()) {
      if (!currentUser.badges.includes('citoyen')) {
        const updatedUser: User = { ...currentUser, badges: [...currentUser.badges, 'citoyen'] };
        setCurrentUser(updatedUser);
        addNotification('🎉 Badge Débloqué : Citoyen !');
      }
    }

    addNotification(`Merci ${name} ! Votre signature a été enregistrée.`);
    return true;
  };

  const boostPetition = async (id: string, boostLevel: 'ndamel' | 'teranga' | 'lion', amount: number, paymentMethod: string): Promise<boolean> => {
    setPetitions(prev => prev.map(pet => {
      if (pet.id === id) {
        return {
          ...pet,
          boosted: true,
          boostLevel
        };
      }
      return pet;
    }));

    if (useSupabase) {
      supabase.from('petitions').update({
        boosted: true,
        boost_level: boostLevel
      }).eq('id', id).then(({ error }) => {
        if (error) console.error("Error boosting petition in Supabase: ", error);
      });
    }

    if (currentUser) {
      if (!currentUser.badges.includes('ambassadeur')) {
        const updatedUser = { ...currentUser, badges: [...currentUser.badges, 'ambassadeur'] };
        setCurrentUser(updatedUser);
        addNotification('🎉 Badge Débloqué : Ambassadeur !');
      }
    }

    addNotification(`Félicitations ! Votre boost de ${amount.toLocaleString('fr-FR')} FCFA via ${paymentMethod} a été activé.`);
    return true;
  };

  const donateToCagnotte = async (id: string, amount: number, name: string, comment: string, isDiaspora: boolean, paymentMethod: string): Promise<boolean> => {
    setCagnottes(prev => prev.map(cag => {
      if (cag.id === id) {
        return {
          ...cag,
          amountCollected: cag.amountCollected + amount,
          donors: [{ name, amount, date: new Date().toISOString().split('T')[0], comment, isDiaspora }, ...cag.donors]
        };
      }
      return cag;
    }));

    if (useSupabase) {
      const cag = cagnottes.find(c => c.id === id);
      if (cag) {
        const newDonor = { name, amount, date: new Date().toISOString().split('T')[0], comment, isDiaspora };
        const updatedDonors = [newDonor, ...cag.donors];
        
        supabase.from('cagnottes').update({
          amount_collected: cag.amountCollected + amount,
          donors: updatedDonors
        }).eq('id', id).then(({ error }) => {
          if (error) console.error("Error donating in Supabase: ", error);
        });
      }
    }

    // Unlock Badges
    if (currentUser && name.toLowerCase() === currentUser.name.toLowerCase()) {
      let updatedBadges = [...currentUser.badges];
      
      if (!updatedBadges.includes('bienfaiteur')) {
        updatedBadges.push('bienfaiteur');
        addNotification('🎉 Badge Débloqué : Bienfaiteur !');
      }

      if (isDiaspora && !updatedBadges.includes('ambassadeur')) {
        updatedBadges.push('ambassadeur');
        addNotification('🎉 Badge Débloqué : Ambassadeur (Diaspora Solidaire) !');
      }

      const updatedUser: User = { ...currentUser, badges: updatedBadges };
      setCurrentUser(updatedUser);
    }

    addNotification(`Don de ${amount.toLocaleString('fr-FR')} FCFA reçu avec succès via ${paymentMethod} !`);
    return true;
  };

  const applyToMission = async (id: string, name: string, email: string, phone: string, message: string): Promise<boolean> => {
    const newApp: VolunteerApplication = {
      id: `app_${Math.random().toString(36).substr(2, 9)}`,
      missionId: id,
      userName: name,
      userEmail: email,
      userPhone: phone,
      message,
      appliedAt: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setVolunteerApplications(prev => [newApp, ...prev]);

    setVolunteerMissions(prev => prev.map(mis => {
      if (mis.id === id) {
        return { ...mis, volunteersCount: mis.volunteersCount + 1 };
      }
      return mis;
    }));
    if (currentUser && name.toLowerCase() === currentUser.name.toLowerCase()) {
      if (!currentUser.badges.includes('batisseur')) {
        const updatedUser: User = { ...currentUser, badges: [...currentUser.badges, 'batisseur'] };
        setCurrentUser(updatedUser);
        addNotification('🎉 Badge Débloqué : Bâtisseur !');
      }
    }

    addNotification(`Candidature soumise pour la mission bénévolat.`);
    return true;
  };

  const createPetition = (petitionData: Omit<Petition, 'id' | 'signaturesCount' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'signers'>): string => {
    if (!currentUser) return '';
    const newId = `pet_${Math.random().toString(36).substr(2, 9)}`;
    const newPet: Petition = {
      ...petitionData,
      id: newId,
      signaturesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active', // starts active immediately for global visibility
      organizer: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        verified: currentUser.verified,
        trustScore: currentUser.trustScore
      },
      updates: [],
      signers: []
    };

    setPetitions(prev => [newPet, ...prev]);
    
    if (useSupabase) {
      supabase.from('petitions').insert([{
        id: newId,
        title: newPet.title,
        description: newPet.description,
        cover_image: newPet.coverImage,
        category: newPet.category,
        signatures_count: 0,
        signatures_target: newPet.signaturesTarget,
        recipient: newPet.recipient,
        location: newPet.location,
        date_limit: newPet.dateLimit,
        created_at: newPet.createdAt,
        status: 'active',
        organizer: newPet.organizer,
        updates: [],
        signers: [],
        boosted: false,
        viewed_by_admin: false
      }]).then(({ error }) => {
        if (error) console.error("Error creating petition in Supabase: ", error);
      });
    }

    // Unlock Leader badge
    if (!currentUser.badges.includes('leader')) {
      const updatedUser: User = { ...currentUser, badges: [...currentUser.badges, 'leader'] };
      setCurrentUser(updatedUser);
      addNotification('🎉 Badge Débloqué : Leader !');
    }

    addNotification('Pétition soumise ! Suivez son statut de modération en temps réel.');
    return newId;
  };

  const createCagnotte = (cagnotteData: Omit<Cagnotte, 'id' | 'amountCollected' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'expenses' | 'donors'>): string => {
    if (!currentUser) return '';
    const newId = `cag_${Math.random().toString(36).substr(2, 9)}`;
    const newCag: Cagnotte = {
      ...cagnotteData,
      id: newId,
      amountCollected: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active', // starts active immediately for global visibility
      organizer: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        verified: currentUser.verified,
        trustScore: currentUser.trustScore
      },
      updates: [],
      expenses: [],
      donors: []
    };

    setCagnottes(prev => [newCag, ...prev]);

    if (useSupabase) {
      supabase.from('cagnottes').insert([{
        id: newId,
        title: newCag.title,
        description: newCag.description,
        cover_image: newCag.coverImage,
        category: newCag.category,
        amount_collected: 0,
        amount_target: newCag.amountTarget,
        location: newCag.location,
        created_at: newCag.createdAt,
        status: 'active',
        organizer: newCag.organizer,
        is_diaspora_targeted: newCag.isDiasporaTargeted,
        updates: [],
        expenses: [],
        donors: [],
        documents: newCag.documents || [],
        gallery: newCag.gallery || [],
        viewed_by_admin: false
      }]).then(({ error }) => {
        if (error) console.error("Error creating cagnotte in Supabase: ", error);
      });
    }

    // Unlock Leader badge
    if (!currentUser.badges.includes('leader')) {
      const updatedUser: User = { ...currentUser, badges: [...currentUser.badges, 'leader'] };
      setCurrentUser(updatedUser);
      addNotification('🎉 Badge Débloqué : Leader !');
    }

    addNotification('Cagnotte créée ! Suivez son statut de modération en temps réel.');
    return newId;
  };

  const createVolunteerMission = (missionData: Omit<VolunteerMission, 'id' | 'volunteersCount' | 'createdAt' | 'organizer' | 'status'>) => {
    if (!currentUser) return;
    const newMis: VolunteerMission = {
      ...missionData,
      id: `vol_${Math.random().toString(36).substr(2, 9)}`,
      volunteersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      organizer: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      }
    };

    setVolunteerMissions(prev => [newMis, ...prev]);
    addNotification('Mission bénévole publiée avec succès.');
  };

  // ADMIN ACTIONS
  const approveCampaign = (id: string, type: 'petition' | 'cagnotte') => {
    let title = '';
    let organizerId = '';
    let organizerName = '';

    if (type === 'petition') {
      setPetitions(prev => prev.map(p => {
        if (p.id === id) {
          title = p.title;
          organizerId = p.organizer.id;
          organizerName = p.organizer.name;
          return { ...p, status: 'active', viewedByAdmin: true };
        }
        return p;
      }));
      addNotification('La pétition a été approuvée et publiée.');
    } else {
      setCagnottes(prev => prev.map(c => {
        if (c.id === id) {
          title = c.title;
          organizerId = c.organizer.id;
          organizerName = c.organizer.name;
          return { ...c, status: 'active', viewedByAdmin: true };
        }
        return c;
      }));
      addNotification('La cagnotte a été approuvée et activée.');
    }

    if (useSupabase) {
      const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
      supabase.from(tableName).update({
        status: 'active',
        viewed_by_admin: true
      }).eq('id', id).then(({ error }) => {
        if (error) console.error("Error approving campaign in Supabase: ", error);
      });
    }

    // Trigger follower notifications!
    setTimeout(() => {
      if (organizerId && currentUser?.following?.includes(organizerId)) {
        triggerPushNotification(
          `📢 Nouveau projet de ${organizerName}`,
          `Vient de lancer la campagne : "${title}"`
        );
      }
    }, 1000);
  };

  const rejectCampaign = (id: string, type: 'petition' | 'cagnotte', feedback: string) => {
    if (type === 'petition') {
      setPetitions(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', rejectionFeedback: feedback, viewedByAdmin: true } : p));
      addNotification('La pétition a été rejetée avec retours.');
    } else {
      setCagnottes(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected', rejectionFeedback: feedback, viewedByAdmin: true } : c));
      addNotification('La cagnotte a été rejetée avec retours.');
    }

    if (useSupabase) {
      const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
      supabase.from(tableName).update({
        status: 'rejected',
        rejection_feedback: feedback,
        viewed_by_admin: true
      }).eq('id', id).then(({ error }) => {
        if (error) console.error("Error rejecting campaign in Supabase: ", error);
      });
    }
  };

  const markCampaignAsViewed = (id: string, type: 'petition' | 'cagnotte') => {
    if (type === 'petition') {
      setPetitions(prev => prev.map(p => p.id === id ? { ...p, viewedByAdmin: true } : p));
    } else {
      setCagnottes(prev => prev.map(c => c.id === id ? { ...c, viewedByAdmin: true } : c));
    }

    if (useSupabase) {
      const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
      supabase.from(tableName).update({
        viewed_by_admin: true
      }).eq('id', id).then(({ error }) => {
        if (error) console.error("Error marking campaign viewed in Supabase: ", error);
      });
    }
  };

  const resubmitCampaign = (
    id: string, 
    type: 'petition' | 'cagnotte', 
    title: string, 
    description: string, 
    targetValue?: number,
    location?: string,
    coverImage?: string,
    recipient?: string,
    isDiasporaTargeted?: boolean,
    documents?: string[],
    gallery?: string[]
  ) => {
    if (type === 'petition') {
      setPetitions(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            title,
            description,
            signaturesTarget: targetValue || p.signaturesTarget,
            location: location || p.location,
            coverImage: coverImage || p.coverImage,
            recipient: recipient || p.recipient,
            status: 'active',
            viewedByAdmin: false,
            rejectionFeedback: undefined
          };
        }
        return p;
      }));
      addNotification('Pétition mise à jour et réactivée !');
    } else {
      setCagnottes(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            title,
            description,
            amountTarget: targetValue || c.amountTarget,
            location: location || c.location,
            coverImage: coverImage || c.coverImage,
            isDiasporaTargeted: isDiasporaTargeted !== undefined ? isDiasporaTargeted : c.isDiasporaTargeted,
            documents: documents || c.documents,
            gallery: gallery || c.gallery,
            status: 'active',
            viewedByAdmin: false,
            rejectionFeedback: undefined
          };
        }
        return c;
      }));
      addNotification('Cagnotte mise à jour et réactivée !');
    }

    if (useSupabase) {
      const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
      const updates: any = {
        title,
        description,
        location,
        cover_image: coverImage,
        status: 'active',
        viewed_by_admin: false,
        rejection_feedback: null
      };
      if (type === 'petition') {
        if (targetValue) updates.signatures_target = targetValue;
        if (recipient) updates.recipient = recipient;
      } else {
        if (targetValue) updates.amount_target = targetValue;
        if (isDiasporaTargeted !== undefined) updates.is_diaspora_targeted = isDiasporaTargeted;
        if (documents) updates.documents = documents;
        if (gallery) updates.gallery = gallery;
      }

      supabase.from(tableName).update(updates).eq('id', id).then(({ error }) => {
        if (error) console.error("Error resubmitting campaign in Supabase: ", error);
      });
    }
  };

  const addCampaignUpdate = (id: string, type: 'petition' | 'cagnotte', title: string, content: string) => {
    if (!currentUser) return;
    const newUpdate: Update = {
      id: `upd_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      title,
      content,
      author: currentUser.name
    };

    if (type === 'petition') {
      setPetitions(prev => prev.map(p => p.id === id ? { ...p, updates: [newUpdate, ...p.updates] } : p));
    } else {
      setCagnottes(prev => prev.map(c => c.id === id ? { ...c, updates: [newUpdate, ...c.updates] } : c));
    }
    addNotification('Actualité ajoutée à la campagne.');

    if (useSupabase) {
      const tableName = type === 'petition' ? 'petitions' : 'cagnottes';
      const campaign = type === 'petition' ? petitions.find(p => p.id === id) : cagnottes.find(c => c.id === id);
      if (campaign) {
        const updatedUpdates = [newUpdate, ...campaign.updates];
        supabase.from(tableName).update({
          updates: updatedUpdates
        }).eq('id', id).then(({ error }) => {
          if (error) console.error("Error adding update in Supabase: ", error);
        });
      }
    }
  };

  const addCampaignExpense = (cagnotteId: string, description: string, amount: number, category: string) => {
    const newExpense: Expense = {
      id: `exp_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      description,
      amount,
      category,
      receiptUrl: '#recu_pdf'
    };

    setCagnottes(prev => prev.map(c => {
      if (c.id === cagnotteId) {
        return {
          ...c,
          expenses: [newExpense, ...c.expenses]
        };
      }
      return c;
    }));

    addNotification('Nouvelle dépense ajoutée au registre de transparence.');

    if (useSupabase) {
      const cag = cagnottes.find(c => c.id === cagnotteId);
      if (cag) {
        const updatedExpenses = [newExpense, ...cag.expenses];
        supabase.from('cagnottes').update({
          expenses: updatedExpenses
        }).eq('id', cagnotteId).then(({ error }) => {
          if (error) console.error("Error adding expense in Supabase: ", error);
        });
      }
    }
  };

  // REAL SUPABASE GOOGLE LOGIN ACTION
  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      addNotification(`❌ Connexion Google échouée: ${err.message}`);
    }
  };

  // MOCK AI GENERATION
  const sendIAMessage = (text: string, campaignType: 'petition' | 'cagnotte' | 'both', tone: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Math.random().toString(36).substr(2, 9)}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);

    // Simulate AI thinking and replying
    setTimeout(() => {
      // Mocked AI templates based on keyword matching
      let title = 'Accès à l\'Eau Potable pour le Village de Barkedji';
      let description = 'Le village fait face à une déshydratation alarmante...';
      let petitionText = '';
      
      const promptLower = text.toLowerCase();
      if (promptLower.includes('ecole') || promptLower.includes('école') || promptLower.includes('fourniture') || promptLower.includes('ndande')) {
        title = 'Restauration Scolaire et Réfection des Classes de Ndande';
        description = 'L\'école primaire de Ndande a perdu ses toitures lors des dernières intempéries. Plus de 120 élèves sont privés de locaux d\'études décents, mettant en péril leur avenir scolaire et leur sécurité.';
        petitionText = 'À l\'attention de Monsieur le Ministre de l\'Éducation Nationale,\n\nNous, citoyens du Sénégal et de la diaspora, réclamons la reconstruction urgente des bâtiments scolaires de Ndande et la mise en conformité des infrastructures de secours. Nos enfants ont droit à l\'éducation dans un climat sûr.';
      } else if (promptLower.includes('matern') || promptLower.includes('hopital') || promptLower.includes('sante') || promptLower.includes('kolda')) {
        title = 'Amélioration Urgente de la Maternité Régionale de Kolda';
        description = 'La maternité de Kolda manque de lits obstétriques, d\'incubateurs et de produits sanitaires essentiels. Des vies de mamans et de nouveau-nés sont menacées quotidiennement.';
        petitionText = 'À l\'attention de Monsieur le Directeur Régional de la Santé de Kolda,\n\nNous demandons la modernisation et la dotation en matériel de réanimation néonatale de la maternité de Kolda. Aucune femme ne devrait donner la vie au péril de la sienne.';
      } else if (promptLower.includes('ambulance') || promptLower.includes('dispensaire')) {
        title = 'Achat d\'une Ambulance Médicalisée pour le Dispensaire de Dialacoto';
        description = 'Situé à plus de 70 km de l\'hôpital régional le plus proche, le dispensaire de Dialacoto ne dispose pas de véhicule de transfert d\'urgence, obligeant les patients critiques à voyager en calèche.';
      }

      const toneEmoji = tone === 'Engagé' ? '🔥' : tone === 'Urgent' ? '⚠️' : '🤝';

      const facebookPost = `${toneEmoji} APPEL À LA SOLIDARITÉ CITOYENNE : ${title.toUpperCase()} ${toneEmoji}\n\n📍 Sénégal, Région concernée.\n\n${description}\n\nChaque partage compte, chaque geste sauve. Rejoignez-nous pour transformer cette cause en impact réel !\n\n👉 Signez et donnez sur SunuYite.sn\n#SunuYite #Senegal #Solidarite #Impact`;

      const whatsappMessage = `*${toneEmoji} MObilisons-nous pour : ${title}* ${toneEmoji}\n\n${description.slice(0, 150)}...\n\nS\'il vous plaît, prenez 1 minute pour signer la pétition ou faire un don via Wave/Orange Money.\n\n👉 Lien de la cause : https://sunuyite.sn/campagne-live\n\n_Transmettez à vos groupes d\'entraide !_`;

      const flyerBg = tone === 'Urgent' ? 'radial-gradient(circle, #7f1d1d 0%, #111827 100%)' : 'radial-gradient(circle, #064e3b 0%, #111827 100%)';
      const flyerLayout = `
        background: ${flyerBg};
        color: #ffffff;
        padding: 2.5rem;
        border-radius: 20px;
        text-align: center;
        border: 4px solid var(--secondary);
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        font-family: 'Plus Jakarta Sans', sans-serif;
      `;

      const iaMsg: ChatMessage = {
        id: `msg_${Math.random().toString(36).substr(2, 9)}`,
        sender: 'ia',
        text: `Voici une proposition de campagne générée en mode *${tone}* : \n\n*Titre proposé* : ${title}\n*Description* : ${description}\n\nLes textes de partage réseaux sociaux et de l'affiche digitale sont prêts ci-dessous ! Cliquez sur "Appliquer" pour charger ces données dans les formulaires de création.`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        generationResult: {
          title,
          description,
          petitionText,
          facebookPost,
          whatsappMessage,
          flyerLayout
        }
      };

      setChatHistory(prev => [...prev, iaMsg]);
      addNotification('🤖 Contenu de campagne généré par Sunu Yité IA !');
    }, 1500);
  };

  const clearChat = () => {
    setChatHistory([
      {
        id: 'msg_welcome',
        sender: 'ia',
        text: 'Sénégal Sunu Yité Assistant IA 👋 ! Je peux vous aider à rédiger le titre, la description, les messages de partage WhatsApp, Facebook et concevoir une affiche publicitaire pour votre pétition ou cagnotte. Que souhaitez-vous mobiliser aujourd\'hui ?',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Créer un forage à Barkedji',
          'Soutenir une maternité locale',
          'Acheter des fournitures scolaires pour mon village'
        ]
      }
    ]);
  };

  // login action
  const login = async (email: string, pass: string): Promise<boolean> => {
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'mouhamethsarr98@gmail.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Malamine0163@';

    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass
        });
        if (error) {
          // Fallback to local citizen login check if Supabase login fails (e.g. for locally created mock users)
          const localUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (localUser) {
            const mockPasswords = JSON.parse(localStorage.getItem('sc_mock_passwords') || '{}');
            const savedPass = mockPasswords[email.toLowerCase()];
            if (!savedPass || savedPass === pass) {
              setCurrentUser(localUser);
              addNotification(`Bonjour, ${localUser.name} ! (Session locale de secours)`);
              return true;
            }
          }
          addNotification(`❌ ${error.message}`);
          throw new Error(error.message);
        }
        
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (profile) {
            const matchedUser: User = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              phone: profile.phone || '',
              role: (profile.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ? 'admin' : (profile.role || 'citizen'),
              verified: profile.verified || false,
              avatar: profile.avatar || '',
              trustScore: profile.trust_score || 50,
              badges: profile.badges || [],
              bio: profile.bio,
              address: profile.address,
              country: profile.country,
              region: profile.region,
              idCardRecto: profile.id_card_recto,
              idCardVerso: profile.id_card_verso,
              selfie: profile.selfie,
              verificationStatus: profile.verification_status || 'none',
              cniNumber: profile.cni_number,
              dob: profile.dob,
              following: profile.following || [],
              followers: profile.followers || []
            };
            setCurrentUser(matchedUser);
            addNotification(`Bonjour, ${matchedUser.name} !`);
            return true;
          } else {
            console.warn("⚠️ Profil introuvable dans la table profiles. Création d'un profil de secours...");
            const isSessionAdmin = data.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const fallbackProfile = {
              id: data.user.id,
              name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Citoyen',
              email: data.user.email || '',
              phone: data.user.user_metadata?.phone || '',
              role: isSessionAdmin ? 'admin' : (data.user.user_metadata?.role || 'citizen'),
              verified: isSessionAdmin ? true : false,
              trust_score: isSessionAdmin ? 100 : 50,
              avatar: data.user.user_metadata?.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==',
              country: data.user.user_metadata?.country || 'Sénégal',
              region: data.user.user_metadata?.region || 'Dakar',
              verification_status: isSessionAdmin ? 'verified' : 'none'
            };
            
            const { error: insertError } = await supabase.from('profiles').insert([fallbackProfile]);
            if (insertError) {
              console.error("Erreur lors de la création du profil de secours :", insertError);
            }
            
            const matchedUser: User = {
              id: fallbackProfile.id,
              name: fallbackProfile.name,
              email: fallbackProfile.email,
              phone: fallbackProfile.phone,
              role: fallbackProfile.role as 'citizen' | 'organizer' | 'admin',
              verified: fallbackProfile.verified,
              avatar: fallbackProfile.avatar,
              trustScore: fallbackProfile.trust_score,
              badges: [],
              country: fallbackProfile.country,
              region: fallbackProfile.region,
              verificationStatus: fallbackProfile.verification_status as 'none' | 'pending' | 'verified' | 'rejected',
              following: [],
              followers: []
            };
            setCurrentUser(matchedUser);
            addNotification(`Bonjour, ${matchedUser.name} (profil initialisé) !`);
            return true;
          }
        }
        return false;
      } catch (err: any) {
        console.error(err);
        addNotification(`❌ ${err.message || 'Une erreur est survenue lors de la connexion.'}`);
        throw err;
      }
    }

    if (email && adminEmail && email.toLowerCase() === adminEmail.toLowerCase() && pass === adminPassword) {
      const existingAdmin = usersList.find(u => u.email && u.email.toLowerCase() === adminEmail.toLowerCase());
      const adminUser: User = {
        id: 'usr_admin_mouhameth',
        name: 'Mouhameth Sarr',
        email: adminEmail,
        phone: '+221 70 111 22 33',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80',
        badges: ['leader', 'bienfaiteur', 'citoyen'],
        ...existingAdmin, // preserves modified properties (phone, address, dob, CNI, verificationStatus, selfie, etc.)
        role: 'admin',    // enforces admin role
        verified: true,   // enforces verified status
        trustScore: 100   // enforces trust score
      };
      
      // Ensure admin exists in usersList or is updated
      setUsersList(prev => {
        const index = prev.findIndex(u => u.email && u.email.toLowerCase() === adminEmail.toLowerCase());
        if (index === -1) {
          return [adminUser, ...prev];
        } else {
          return prev.map(u => (u.email && u.email.toLowerCase() === adminEmail.toLowerCase()) ? { ...u, ...adminUser } : u);
        }
      });

      setCurrentUser(adminUser);
      addNotification('🛡️ Connexion réussie en tant qu\'Administrateur !');
      return true;
    }

    // Citizen login check
    const existingUser = usersList.find(u => u.email && email && u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      const mockPasswords = JSON.parse(localStorage.getItem('sc_mock_passwords') || '{}');
      const savedPass = mockPasswords[email.toLowerCase()];
      
      if (!savedPass || savedPass === pass) {
        setCurrentUser(existingUser);
        addNotification(`Bonjour, ${existingUser.name} !`);
        return true;
      }
    }

    addNotification('❌ Identifiants incorrects.');
    return false;
  };

  // signup action
  const signup = async (
    name: string, 
    email: string, 
    phone: string, 
    pass: string, 
    country: string, 
    region: string, 
    accountType: 'citizen' | 'company' | 'ngo' = 'citizen'
  ): Promise<{ success: boolean; needsConfirmation: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/[\s-]/g, '');

    // 1. Email format check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("Veuillez saisir une adresse e-mail valide.");
    }

    // 2. Strict disposable email domain blacklist check
    const domain = cleanEmail.split('@')[1];
    const DISPOSABLE_DOMAINS = [
      'yopmail.com', 'mailinator.com', 'tempmail.com', 'temp-mail.org', 
      '10minutemail.com', 'guerrillamail.com', 'getairmail.com', 'sharklasers.com', 
      'dispostable.com', 'crazymailing.com', 'tempmailaddress.com', 'yopmail.fr', 
      'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf', 'courriel.fr.nf', 'moncourrier.fr.nf',
      'monemail.fr.nf', 'monmail.fr.nf', 'tempmail.dev', 'tempmail.net'
    ];
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      throw new Error("Les adresses e-mail temporaires ou jetables ne sont pas autorisées pour s'inscrire.");
    }

    // 3. Phone length check
    if (cleanPhone.length < 7) {
      throw new Error("Veuillez saisir un numéro de téléphone valide.");
    }

    // 4. Email and phone uniqueness checks on local usersList cache
    const emailExists = usersList.some(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      throw new Error("Cette adresse e-mail est déjà associée à un compte.");
    }
    const phoneExists = usersList.some(u => u.phone && u.phone.replace(/[\s-]/g, '') === cleanPhone);
    if (phoneExists) {
      throw new Error("Ce numéro de téléphone est déjà associé à un compte.");
    }

    if (!useSupabase && cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      alert("Cette adresse e-mail est réservée à l'administrateur.");
      return { success: false, needsConfirmation: false };
    }

    const signupLocalFallback = async (): Promise<{ success: boolean; needsConfirmation: boolean }> => {
      // Double check in fallback
      if (usersList.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
        throw new Error("Cette adresse e-mail est déjà associée à un compte.");
      }
      if (usersList.some(u => u.phone && u.phone.replace(/[\s-]/g, '') === cleanPhone)) {
        throw new Error("Ce numéro de téléphone est déjà associé à un compte.");
      }

      const newUser: User = {
        id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email: cleanEmail,
        phone,
        role: 'citizen',
        verified: false,
        avatar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==',
        trustScore: 50,
        badges: [],
        country,
        region,
        accountType,
        following: [],
        followers: []
      };

      // Save password in mock database
      try {
        const mockPasswords = JSON.parse(localStorage.getItem('sc_mock_passwords') || '{}');
        mockPasswords[cleanEmail] = pass;
        localStorage.setItem('sc_mock_passwords', JSON.stringify(mockPasswords));
      } catch (e) {
        console.error("Failed to save mock passwords to storage:", e);
      }

      setUsersList(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      addNotification('⚠️ [Mode Secours] Inscription locale réussie suite à une limite de Supabase.');
      return { success: true, needsConfirmation: false };
    };

    if (useSupabase) {
      try {
        // 5. Supabase DB Uniqueness Checks before calling auth.signUp
        const { data: existingProfiles, error: checkError } = await supabase
          .from('profiles')
          .select('id, email, phone')
          .or(`email.eq.${cleanEmail},phone.eq.${cleanPhone}`);

        if (checkError) {
          console.error("Erreur lors de la vérification d'unicité dans Supabase :", checkError);
        } else if (existingProfiles && existingProfiles.length > 0) {
          const emailDuplicate = existingProfiles.some(p => p.email && p.email.toLowerCase() === cleanEmail);
          const phoneDuplicate = existingProfiles.some(p => p.phone && p.phone.replace(/[\s-]/g, '') === cleanPhone);
          if (emailDuplicate) {
            throw new Error("Cette adresse e-mail est déjà associée à un compte.");
          }
          if (phoneDuplicate) {
            throw new Error("Ce numéro de téléphone est déjà associé à un compte.");
          }
        }

        const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pass,
          options: {
            data: {
              full_name: name,
              phone: phone,
              role: isAdmin ? 'admin' : 'citizen',
              verified: isAdmin ? true : false,
              trust_score: isAdmin ? 100 : 50,
              avatar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==',
              country,
              region,
              account_type: accountType
            }
          }
        });
        if (error) {
          // If rate limit is hit, fall back to local signup
          if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('rate_limit')) {
            console.warn("⚠️ Limite d'inscription Supabase atteinte. Basculement en mode secours local.");
            return await signupLocalFallback();
          }
          addNotification(`❌ ${error.message}`);
          throw new Error(error.message);
        }
        if (data.user) {
          // Explicitly insert profile immediately to avoid waiting for triggers
          const newProfile = {
            id: data.user.id,
            name,
            email: cleanEmail,
            phone,
            role: isAdmin ? 'admin' : 'citizen',
            verified: isAdmin ? true : false,
            trust_score: isAdmin ? 100 : 50,
            avatar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==',
            country,
            region,
            account_type: accountType
          };
          
          const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
          if (profileError) {
            console.error("Erreur lors de la création directe du profil :", profileError);
          }

          const newUser: User = {
            id: data.user.id,
            name,
            email: cleanEmail,
            phone,
            role: isAdmin ? 'admin' : 'citizen',
            verified: isAdmin ? true : false,
            avatar: newProfile.avatar,
            trustScore: isAdmin ? 100 : 50,
            badges: [],
            country,
            region,
            accountType,
            following: [],
            followers: []
          };
          
          if (data.session) {
            setCurrentUser(newUser);
            setUsersList(prev => [...prev, newUser]);
            addNotification('🎉 Compte créé ! Bienvenue sur Sunu Yité.');
            return { success: true, needsConfirmation: false };
          } else {
            addNotification('📧 Un e-mail de confirmation a été envoyé. Veuillez activer votre compte via le lien reçu.');
            return { success: true, needsConfirmation: true };
          }
        }
        return { success: false, needsConfirmation: false };
      } catch (err: any) {
        console.error(err);
        if (err.message.toLowerCase().includes('rate limit') || err.message.toLowerCase().includes('rate_limit')) {
          return await signupLocalFallback();
        }
        addNotification(`❌ ${err.message || "Une erreur est survenue lors de l'inscription."}`);
        throw err;
      }
    }

    return await signupLocalFallback();
  };

  const isBasicProfileComplete = (user: User | null): boolean => {
    if (!user) return false;
    const hasName = !!(user.name && user.name.trim().length > 0);
    const hasPhone = !!(user.phone && user.phone.trim().length > 0);
    const hasCountry = !!(user.country && user.country.trim().length > 0);
    const hasRegion = !!(user.region && user.region.trim().length > 0);
    const hasAddress = !!(user.address && user.address.trim().length > 0);
    
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
    const hasAvatar = !!(user.avatar && user.avatar.trim().length > 0 && user.avatar !== defaultAvatar);
    
    return hasName && hasPhone && hasCountry && hasRegion && hasAddress && hasAvatar;
  };

  const isProfileComplete = (user: User | null): boolean => {
    if (!user) return false;
    const hasName = !!(user.name && user.name.trim().length > 0);
    const hasPhone = !!(user.phone && user.phone.trim().length > 0);
    const hasCountry = !!(user.country && user.country.trim().length > 0);
    const hasRegion = !!(user.region && user.region.trim().length > 0);
    const hasAddress = !!(user.address && user.address.trim().length > 0);
    
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
    const hasAvatar = !!(user.avatar && user.avatar.trim().length > 0 && user.avatar !== defaultAvatar);
    
    const hasCniNumber = !!(user.cniNumber && user.cniNumber.trim().length > 0);
    const hasDob = !!(user.dob && user.dob.trim().length > 0);
    const hasIdRecto = !!(user.idCardRecto && user.idCardRecto.trim().length > 0);
    const hasIdVerso = !!(user.idCardVerso && user.idCardVerso.trim().length > 0);
    const hasSelfie = !!(user.selfie && user.selfie.trim().length > 0);
    const isVerifiedIdentity = user.verificationStatus === 'verified';
    
    return hasName && hasPhone && hasCountry && hasRegion && hasAddress && hasAvatar && 
           hasCniNumber && hasDob && hasIdRecto && hasIdVerso && hasSelfie && isVerifiedIdentity;
  };

  const updateProfile = async (
    name: string, 
    phone: string, 
    avatar: string, 
    bio?: string, 
    address?: string, 
    country?: string, 
    region?: string,
    idCardRecto?: string,
    idCardVerso?: string,
    selfie?: string,
    verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected',
    cniNumber?: string,
    dob?: string
  ): Promise<boolean> => {
    if (!currentUser) return false;

    let isVerified = currentUser.verified;
    if (verificationStatus === 'verified') {
      isVerified = true;
    } else if (verificationStatus === 'pending' || verificationStatus === 'rejected') {
      isVerified = false;
    }

    const updatedUser: User = {
      ...currentUser,
      name,
      phone,
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&fit=crop&q=80',
      bio,
      address,
      country: country || currentUser.country || 'Sénégal',
      region: region || currentUser.region || 'Dakar',
      idCardRecto: idCardRecto !== undefined ? idCardRecto : currentUser.idCardRecto,
      idCardVerso: idCardVerso !== undefined ? idCardVerso : currentUser.idCardVerso,
      selfie: selfie !== undefined ? selfie : currentUser.selfie,
      verificationStatus: verificationStatus !== undefined ? verificationStatus : currentUser.verificationStatus,
      cniNumber: cniNumber !== undefined ? cniNumber : currentUser.cniNumber,
      dob: dob !== undefined ? dob : currentUser.dob,
      verified: isVerified,
      trustScore: isVerified ? 100 : 50 // Will be calculated dynamically below
    };

    updatedUser.trustScore = isVerified ? 100 : recalculateUserTrustScore(updatedUser);
    const newTrustScore = updatedUser.trustScore;
    
    setCurrentUser(updatedUser);
    setUsersList(prev => prev.map(u => (u.id === currentUser.id || (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())) ? { ...u, ...updatedUser } : u));
    
    if (useSupabase) {
      supabase.from('profiles').update({
        name,
        phone,
        avatar,
        bio,
        address,
        country: country || currentUser.country || 'Sénégal',
        region: region || currentUser.region || 'Dakar',
        id_card_recto: idCardRecto !== undefined ? idCardRecto : currentUser.idCardRecto,
        id_card_verso: idCardVerso !== undefined ? idCardVerso : currentUser.idCardVerso,
        selfie: selfie !== undefined ? selfie : currentUser.selfie,
        verification_status: verificationStatus !== undefined ? verificationStatus : currentUser.verificationStatus,
        cni_number: cniNumber !== undefined ? cniNumber : currentUser.cniNumber,
        dob: dob !== undefined ? dob : currentUser.dob,
        verified: isVerified,
        trust_score: newTrustScore
      }).eq('id', currentUser.id).then(({ error }) => {
        if (error) console.error("Error updating profile in Supabase:", error);
      });
    }

    addNotification('👤 Votre profil a été mis à jour avec succès !');
    return true;
  };

  // logout action
  const logout = () => {
    if (useSupabase) {
      supabase.auth.signOut().then(() => {
        setCurrentUser(null);
        addNotification('ℹ️ Déconnexion réussie.');
      });
    } else {
      setCurrentUser(null);
      addNotification('ℹ️ Déconnexion réussie.');
    }
  };

  // deleteAccount action
  const deleteAccount = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const userId = currentUser.id;
    const email = currentUser.email;

    try {
      if (useSupabase) {
        // Delete profile row
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) {
          console.error("Erreur lors de la suppression du profil dans Supabase :", profileError);
          addNotification("❌ Impossible de supprimer le profil de la base de données.");
          return false;
        }

        // Try to trigger self user deletion via RPC if configured
        try {
          await supabase.rpc('delete_user_self');
        } catch (err) {
          console.warn("RPC delete_user_self non configuré ou échec de l'appel direct, déconnexion...", err);
        }

        // Sign out auth user
        await supabase.auth.signOut();
      }

      // Cleanup local lists
      setUsersList(prev => prev.filter(u => u.id !== userId && (!u.email || u.email.toLowerCase() !== email.toLowerCase())));
      
      try {
        const mockPasswords = JSON.parse(localStorage.getItem('sc_mock_passwords') || '{}');
        if (email) {
          delete mockPasswords[email.toLowerCase()];
          localStorage.setItem('sc_mock_passwords', JSON.stringify(mockPasswords));
        }
      } catch (e) {
        console.error("Failed to update mock passwords in storage:", e);
      }

      setCurrentUser(null);
      addNotification("🗑️ Votre compte et toutes vos données personnelles ont été supprimés.");
      return true;
    } catch (err: any) {
      console.error(err);
      addNotification(`❌ Erreur lors de la suppression: ${err.message}`);
      return false;
    }
  };

  // GET PLATFORM KPIS
  const getKPIs = (): AdminKPIs => {
    const totalDonations = cagnottes
      .filter(c => c.status === 'active' || c.status === 'completed')
      .reduce((sum, c) => sum + c.amountCollected, 0);

    const totalSignatures = petitions
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + p.signaturesCount, 0);

    const totalVolunteers = volunteerMissions
      .reduce((sum, m) => sum + m.volunteersCount, 0);

    const activeCampaigns = petitions.filter(p => p.status === 'active').length + cagnottes.filter(c => c.status === 'active').length;

    const totalCampaigns = cagnottes.length + petitions.length;
    const completedCount = cagnottes.filter(c => c.status === 'completed').length;
    const successRate = totalCampaigns > 0 ? Math.round((completedCount / totalCampaigns) * 100) : 100;

    return {
      totalUsers: usersList.length,
      totalDonations,
      totalSignatures,
      totalVolunteers,
      activeCampaigns,
      successRate,
      totalCommissions: Math.round(totalDonations * 0.04) // average commission 4%
    };
  };

  const recalculateUserTrustScore = (user: User): number => {
    let score = 40; // Base score
    
    // Profile completeness
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
    const hasAvatar = user.avatar && user.avatar.trim().length > 0 && user.avatar !== defaultAvatar;
    if (hasAvatar) score += 5;
    
    const hasBio = user.bio && user.bio.trim().length > 0;
    const hasAddress = user.address && user.address.trim().length > 0;
    const hasRegion = user.region && user.region.trim().length > 0;
    if (hasBio && hasAddress && hasRegion) score += 10;
    
    // KYC / identity verification
    const hasCniNumber = user.cniNumber && user.cniNumber.trim().length > 0;
    const hasDob = user.dob && user.dob.trim().length > 0;
    if (hasCniNumber && hasDob) score += 15;
    
    const isVerifiedIdentity = user.verificationStatus === 'verified';
    if (isVerifiedIdentity) score += 20;
    
    // Signatures
    const signedPetitionsCount = petitions.filter(p => 
      p.signers.some(s => {
        const sNameLower = (s.name || '').toLowerCase();
        const uNameLower = (user.name || '').toLowerCase();
        const sEmailLower = (s.name || '').toLowerCase(); // sometimes signers email is mapped in name field
        const uEmailLower = (user.email || '').toLowerCase();
        return sNameLower === uNameLower || (uEmailLower && (sNameLower === uEmailLower || sEmailLower === uEmailLower));
      })
    ).length;
    score += Math.min(10, signedPetitionsCount * 2);
    
    // Donations
    const donationsCount = cagnottes.reduce((sum, c) => {
      const match = c.donors.filter(d => (d.name || '').toLowerCase() === (user.name || '').toLowerCase());
      return sum + match.length;
    }, 0);
    score += Math.min(15, donationsCount * 3);
    
    // Volunteer applications
    const volunteerCount = volunteerApplications.filter(a => 
      (a.userName || '').toLowerCase() === (user.name || '').toLowerCase()
    ).length;
    score += Math.min(15, volunteerCount * 5);
    
    // Organized campaigns
    const organizedCount = petitions.filter(p => p.organizer?.id === user.id).length + 
                           cagnottes.filter(c => c.organizer?.id === user.id).length;
    score += Math.min(20, organizedCount * 10);
    
    // Tontines joined/created
    const savedTontines = JSON.parse(localStorage.getItem('sc_tontines_list') || '[]');
    const tontinesCount = savedTontines.filter((t: any) => 
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
    score += Math.min(15, tontinesCount * 5);
    
    return Math.min(100, score);
  };

  useEffect(() => {
    if (currentUser) {
      const newScore = recalculateUserTrustScore(currentUser);
      if (newScore !== currentUser.trustScore) {
        const updatedUser = { ...currentUser, trustScore: newScore };
        setCurrentUser(updatedUser);
        setUsersList(prev => prev.map(u => {
          if (u.id === currentUser.id) return { ...u, trustScore: newScore };
          const uEmail = (u.email || '').toLowerCase();
          const curEmail = (currentUser.email || '').toLowerCase();
          if (uEmail && curEmail && uEmail === curEmail) return { ...u, trustScore: newScore };
          return u;
        }));
        
        if (useSupabase) {
          supabase.from('profiles').update({ trust_score: newScore }).eq('id', currentUser.id).then(({ error }) => {
            if (error) console.error("Error syncing trust score to Supabase:", error);
          });
        }
      }
    }
  }, [currentUser?.id, currentUser?.avatar, currentUser?.bio, currentUser?.address, currentUser?.region, currentUser?.verificationStatus, petitions, cagnottes, volunteerApplications]);

  const sendDirectMessage = (receiverId: string, text: string) => {
    if (!currentUser) {
      addNotification("⚠️ Connectez-vous d'abord pour envoyer un message.");
      return;
    }
    if (!text || text.trim().length === 0) return;

    const newMsg: DirectMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      receiverId,
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setDirectMessages(prev => [...prev, newMsg]);

    // Simulate auto-reply from other user to make it interactive and feel alive!
    setTimeout(() => {
      const receiver = usersList.find(u => u.id === receiverId);
      const receiverName = receiver ? receiver.name : "Citoyen";
      const autoReplyText = `Merci pour votre message ! Je soutiens pleinement vos initiatives citoyennes. Discutons-en au prochain rassemblement Sunu Yité !`;
      
      const replyMsg: DirectMessage = {
        id: `msg_${Date.now() + 1}`,
        senderId: receiverId,
        receiverId: currentUser.id,
        text: autoReplyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      
      setDirectMessages(prev => [...prev, replyMsg]);
      triggerPushNotification(`💬 Message de ${receiverName}`, autoReplyText);
    }, 3000);
  };

  const adminUpdateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    // Update local state list
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    
    // Update active currentUser if it's the one being modified
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
    }

    // Update campaign organizers in local petitions/cagnottes lists to keep the UI in sync!
    setPetitions(prev => prev.map(p => p.organizer.id === userId ? {
      ...p,
      organizer: {
        ...p.organizer,
        verified: updates.verified !== undefined ? updates.verified : p.organizer.verified,
        trustScore: updates.trustScore !== undefined ? updates.trustScore : p.organizer.trustScore
      }
    } : p));

    setCagnottes(prev => prev.map(c => c.organizer.id === userId ? {
      ...c,
      organizer: {
        ...c.organizer,
        verified: updates.verified !== undefined ? updates.verified : c.organizer.verified,
        trustScore: updates.trustScore !== undefined ? updates.trustScore : c.organizer.trustScore
      }
    } : c));

    // Sync to Supabase
    if (useSupabase) {
      const supabaseUpdates: any = {};
      if (updates.role !== undefined) supabaseUpdates.role = updates.role;
      if (updates.verified !== undefined) supabaseUpdates.verified = updates.verified;
      if (updates.trustScore !== undefined) supabaseUpdates.trust_score = updates.trustScore;
      if (updates.verificationStatus !== undefined) supabaseUpdates.verification_status = updates.verificationStatus;

      const { error } = await supabase
        .from('profiles')
        .update(supabaseUpdates)
        .eq('id', userId);

      if (error) {
        console.error("Error updating user in Supabase:", error);
        return false;
      }
    }

    addNotification("👤 Compte utilisateur mis à jour par l'administrateur !");
    return true;
  };

  const followUser = async (userId: string): Promise<boolean> => {
    if (!currentUser) {
      addNotification("⚠️ Connectez-vous d'abord pour suivre cet utilisateur.");
      return false;
    }
    if (currentUser.id === userId) {
      addNotification("⚠️ Vous ne pouvez pas vous suivre vous-même.");
      return false;
    }

    const currentFollowing = currentUser.following || [];
    if (currentFollowing.includes(userId)) return true;

    const updatedFollowing = [...currentFollowing, userId];
    const updatedUser = { ...currentUser, following: updatedFollowing };
    setCurrentUser(updatedUser);

    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const uFollowers = u.followers || [];
        if (!uFollowers.includes(currentUser.id)) {
          return { ...u, followers: [...uFollowers, currentUser.id] };
        }
      }
      return u;
    }));

    addNotification(`✨ Vous suivez maintenant cet utilisateur !`);

    setTimeout(() => {
      const targetUser = usersList.find(u => u.id === userId);
      if (targetUser) {
        triggerPushNotification(
          `Abonnement`,
          `Vous êtes maintenant abonné aux publications de ${targetUser.name}.`
        );
      }
    }, 1000);

    setTimeout(() => {
      const targetUser = usersList.find(u => u.id === userId);
      if (targetUser) {
        triggerPushNotification(
          `📢 Publication de ${targetUser.name}`,
          `Vient de publier la campagne solidaire : "Reforestation de la forêt classée de Mbao"`
        );
      }
    }, 6000);

    return true;
  };

  const unfollowUser = async (userId: string): Promise<boolean> => {
    if (!currentUser) return false;

    const currentFollowing = currentUser.following || [];
    const updatedFollowing = currentFollowing.filter(id => id !== userId);
    const updatedUser = { ...currentUser, following: updatedFollowing };
    setCurrentUser(updatedUser);

    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        const uFollowers = u.followers || [];
        return { ...u, followers: uFollowers.filter(id => id !== currentUser.id) };
      }
      return u;
    }));

    addNotification(`🚫 Vous ne suivez plus cet utilisateur.`);
    return true;
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      login,
      signup,
      logout,
      loginWithGoogle,
      useSupabase,
      usersList,
      
      // Public profile viewer & Direct messages
      selectedPublicUserId,
      setSelectedPublicUserId,
      directMessages,
      activeChatUserId,
      setActiveChatUserId,
      sendDirectMessage,
      adminUpdateUser,
      followUser,
      unfollowUser,
      petitions,
      cagnottes,
      volunteerMissions,
      volunteerApplications,
      badges: initialBadges,
      activeTheme,
      toggleTheme,
      isMobileView,
      setIsMobileView,
      notifications,
      addNotification,
      
      isProfileComplete,
      isBasicProfileComplete,
      
      // Actions
      updateProfile,
      deleteAccount,
      signPetition,
      boostPetition,
      donateToCagnotte,
      applyToMission,
      createPetition,
      createCagnotte,
      createVolunteerMission,
      
      // Admin
      approveCampaign,
      rejectCampaign,
      markCampaignAsViewed,
      resubmitCampaign,
      addCampaignUpdate,
      addCampaignExpense,
      
      // IA
      chatHistory,
      sendIAMessage,
      clearChat,
      
      // KPIs
      getKPIs,
      
      // PWA
      isInstallable,
      installApp,

      // OTP
      activeOtpCode,
      sendOtpSms,
      verifyOtp
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
