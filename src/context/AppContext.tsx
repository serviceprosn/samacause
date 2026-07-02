import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Petition, Cagnotte, VolunteerMission, VolunteerApplication, Badge, ChatMessage, AdminKPIs, Update, Expense, DirectMessage, Tontine, WithdrawalRequest, PaymentRecord, ActivityLog } from '../types';
import { supabase } from '../services/supabaseClient';
import { messaging } from '../services/firebaseClient';
import { getToken } from 'firebase/messaging';

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
  tontines: Tontine[];
  saveTontine: (tontine: Tontine) => Promise<boolean>;
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
  
  // Withdrawal Requests & Messages helpers
  withdrawalRequests: WithdrawalRequest[];
  submitWithdrawalRequest: (amount: number, method: string, phone: string) => Promise<boolean>;
  submitTontinePayoutRequest: (userId: string, amount: number, tontineName: string, phone: string) => Promise<boolean>;
  approveWithdrawalRequest: (id: string) => Promise<boolean>;
  rejectWithdrawalRequest: (id: string) => Promise<boolean>;
  markMessagesAsRead: (senderId: string) => Promise<void>;

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
  createPetition: (petition: Omit<Petition, 'id' | 'signaturesCount' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'signers'>) => Promise<string>;
  createCagnotte: (cagnotte: Omit<Cagnotte, 'id' | 'amountCollected' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'expenses' | 'donors'>) => Promise<string>;
  createVolunteerMission: (mission: Omit<VolunteerMission, 'id' | 'volunteersCount' | 'createdAt' | 'organizer' | 'status'>) => Promise<string>;
  
  // Admin & Organizer actions
  approveCampaign: (id: string, type: 'petition' | 'cagnotte') => void;
  rejectCampaign: (id: string, type: 'petition' | 'cagnotte', feedback: string) => void;
  deletePublication: (id: string, type: 'petition' | 'cagnotte' | 'volunteer_mission' | 'tontine') => Promise<boolean>;
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
  updateCampaignAfterImage: (id: string, type: 'petition' | 'cagnotte' | 'volunteer', imageAfter: string) => Promise<boolean>;
  
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
  isDataLoaded: boolean;
  loadPetitionDetails: (id: string) => Promise<void>;
  loadCagnotteDetails: (id: string) => Promise<void>;
  loadUserKycDocs: (userId: string) => Promise<void>;
}

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@sunuyite.com';

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialBadges: Badge[] = [
  { id: 'citoyen', name: 'Citoyen', description: 'Signer sa première pétition pour faire entendre sa voix.', icon: '✍️', category: 'Citoyen' },
  { id: 'bienfaiteur', name: 'Bienfaiteur', description: 'Contribuer financièrement à une cause solidaire.', icon: '❤️', category: 'Bienfaiteur' },
  { id: 'ambassadeur', name: 'Ambassadeur', description: 'Partager des pétitions ou cagnottes pour amplifier l\'impact.', icon: '📢', category: 'Ambassadeur' },
  { id: 'batisseur', name: 'Bâtisseur', description: 'Rejoindre et accomplir au moins une mission de bénévolat.', icon: '🛠️', category: 'Bâtisseur' },
  { id: 'leader', name: 'Leader', description: 'Créer et lancer sa propre campagne sur la plateforme.', icon: '👑', category: 'Leader' }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [useSupabase, setUseSupabase] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Public Profile and Direct Message States
  const [selectedPublicUserId, setSelectedPublicUserId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('sc_direct_messages');
    return saved ? JSON.parse(saved) : [];
  });

  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('sc_withdrawal_requests');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('sc_direct_messages', JSON.stringify(directMessages));
    } catch (e) {
      console.error("Failed to save direct messages to storage:", e);
    }
  }, [directMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('sc_withdrawal_requests', JSON.stringify(withdrawalRequests));
    } catch (e) {
      console.error("Failed to save withdrawal requests to storage:", e);
    }
  }, [withdrawalRequests]);
  
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

  const currentUserRef = React.useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
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
        followers: [],
        availableFunds: 0,
        kycRejectReason: ''
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
        followers: [],
        availableFunds: 0,
        kycRejectReason: ''
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
        followers: [],
        availableFunds: 0,
        kycRejectReason: ''
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

  const [tontines, setTontines] = useState<Tontine[]>(() => {
    const saved = localStorage.getItem('sc_tontines_list');
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
      return window.innerWidth < 834;
    }
    return false;
  });
  const [notifications, setNotifications] = useState<string[]>([]);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);

  // PWA Install prompt state & listener (Disabled)
  const isInstallable = false;
  const installApp = async (): Promise<boolean> => {
    return false;
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

  const syncUserSession = async (session: any): Promise<User | null> => {
    if (session && session.user) {
      try {
        const { data: profile, error: selectError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (selectError) {
          // PGRST116 indicates that the profile doesn't exist yet, so we insert the fallback profile
          if (selectError.code === 'PGRST116') {
            console.warn("⚠️ Profil de session introuvable en base. Création d'un profil de secours...");
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
              avatar: u.user_metadata?.avatar_url || u.user_metadata?.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy-yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==',
              country: u.user_metadata?.country || 'Sénégal',
              region: u.user_metadata?.region || 'Dakar',
              verification_status: isSessionAdmin ? 'verified' : 'none',
              account_type: u.user_metadata?.account_type || 'citizen',
              funds_available: 0,
              kyc_reject_reason: ''
            };

            const { error: insertError } = await supabase.from('profiles').insert([fallbackProfile]);
            if (insertError) {
              console.error("Erreur lors de la création directe du profil de secours :", insertError);
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
              accountType: fallbackProfile.account_type as 'citizen' | 'company' | 'ngo',
              following: [],
              followers: [],
              availableFunds: 0,
              kycRejectReason: ''
            };
            setCurrentUser(matchedUser);
          } else {
            // A network or DB connection error occurred. DO NOT clear the currentUser session, keep what is cached.
            console.error("❌ Erreur de connexion réseau lors de la récupération du profil Supabase :", selectError.message);
          }
          return null;
        }

        let matchedUser: User;
        if (profile) {
          // Synchronisation automatique des métadonnées Google (avatar, nom) si le profil en base est par défaut ou vide
          const u = session.user;
          const googleAvatar = u.user_metadata?.avatar_url || u.user_metadata?.avatar;
          const googleName = u.user_metadata?.full_name;
          
          let needsUpdate = false;
          const updatedFields: any = {};
          
          const isDefaultAvatar = !profile.avatar || profile.avatar.startsWith('data:image/svg+xml') || profile.avatar.includes('PHN2ZyB4bWxucz');
          if (isDefaultAvatar && googleAvatar && googleAvatar !== profile.avatar) {
            updatedFields.avatar = googleAvatar;
            needsUpdate = true;
          }
          
          const isDefaultName = !profile.name || profile.name === profile.email?.split('@')[0] || profile.name === 'Citoyen';
          if (isDefaultName && googleName && googleName !== profile.name) {
            updatedFields.name = googleName;
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            console.log("🔄 Synchronisation du profil avec les données Google...", updatedFields);
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updatedFields)
              .eq('id', profile.id);
            if (updateError) {
              console.error("❌ Erreur lors de la mise à jour des métadonnées Google :", updateError);
            } else {
              if (updatedFields.avatar) profile.avatar = updatedFields.avatar;
              if (updatedFields.name) profile.name = updatedFields.name;
            }
          }
          
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
            accountType: profile.account_type || 'citizen',
            following: profile.following || [],
            followers: profile.followers || [],
            availableFunds: Number(profile.funds_available || 0),
            kycRejectReason: profile.kyc_reject_reason || ''
          };
          setCurrentUser(matchedUser);
          return matchedUser;
        }
      } catch (err) {
        console.error("Erreur lors de la synchronisation de la session :", err);
      }
    } else {
      setCurrentUser(null);
    }
    return null;
  };

  // Supabase Data Loaders
  const loadPetitions = async () => {
        const { data, error } = await supabase
          .from('petitions')
          .select('id, title, description, cover_image, category, signatures_count, signatures_target, recipient, location, date_limit, created_at, status, organizer, updates, signers, boosted, boost_level, viewed_by_admin, rejection_feedback, image_before, image_after, gallery')
          .order('created_at', { ascending: false });
        if (!error && data) {
          const mapped = data.map((item: any) => ({
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
            rejectionFeedback: item.rejection_feedback,
            imageBefore: item.image_before || '',
            imageAfter: item.image_after || '',
            gallery: item.gallery || []
          }));
          setPetitions(mapped);
          return mapped;
        }
        return [];
      };

      const loadCagnottes = async () => {
        const { data, error } = await supabase
          .from('cagnottes')
          .select('id, title, description, cover_image, category, amount_collected, amount_target, location, created_at, status, organizer, is_diaspora_targeted, updates, expenses, donors, documents, gallery, viewed_by_admin, rejection_feedback, image_before, image_after')
          .order('created_at', { ascending: false });
        if (!error && data) {
          const mapped = data.map((item: any) => ({
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
            rejectionFeedback: item.rejection_feedback,
            imageBefore: item.image_before || '',
            imageAfter: item.image_after || ''
          }));
          setCagnottes(mapped);
          return mapped;
        }
        return [];
      };

      const loadTontines = async () => {
        const { data, error } = await supabase
          .from('tontines')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setTontines(data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            type: item.type,
            participantsMax: item.participants_max,
            joinedCount: item.joined_count,
            cotisation: Number(item.cotisation),
            frequency: item.frequency,
            startDate: item.start_date,
            endDate: item.end_date,
            orderType: item.order_type,
            status: item.status,
            organizer: item.organizer,
            members: item.members || [],
            payments: item.payments || [],
            activityLogs: item.activity_logs || [],
            votes: item.votes || [],
            chat: item.chat || [],
            guaranteeFundActive: item.guarantee_fund_active || false,
            guaranteeFundAmount: item.guarantee_fund_amount || 0,
            guaranteeFundTotal: item.guarantee_fund_total || 0,
            accumulatedSavings: Number(item.accumulated_savings || 0),
            coverImage: item.cover_image
          })));
        } else if (error) {
          console.warn("Table 'tontines' non configurée ou indisponible dans Supabase, utilisation du stockage local :", error.message);
        }
      };

      const loadVolunteerMissions = async () => {
        const { data, error } = await supabase
          .from('volunteer_missions')
          .select('id, title, description, cover_image, location, duration, needs, category, volunteers_target, volunteers_count, organizer, created_at, status, image_before, image_after')
          .order('created_at', { ascending: false });
        if (!error && data) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            coverImage: item.cover_image,
            location: item.location,
            duration: item.duration,
            needs: item.needs,
            category: item.category,
            volunteersTarget: Number(item.volunteers_target || 0),
            volunteersCount: Number(item.volunteers_count || 0),
            organizer: item.organizer,
            createdAt: item.created_at,
            status: item.status,
            imageBefore: item.image_before || '',
            imageAfter: item.image_after || ''
          }));
          setVolunteerMissions(mapped);
          return mapped;
        } else if (error) {
          console.warn("Table 'volunteer_missions' non configurée dans Supabase, utilisation du stockage local :", error.message);
        }
        return [];
      };

      const loadVolunteerApplications = async () => {
        const { data, error } = await supabase
          .from('volunteer_applications')
          .select('*');
        if (!error && data) {
          setVolunteerApplications(data.map((item: any) => ({
            id: item.id,
            missionId: item.mission_id,
            userName: item.user_name,
            userEmail: item.user_email,
            userPhone: item.user_phone,
            message: item.message,
            appliedAt: item.applied_at,
            status: item.status
          })));
        } else if (error) {
          console.warn("Table 'volunteer_applications' non configurée dans Supabase, utilisation du stockage local :", error.message);
        }
      };

      const loadDirectMessages = async (userId?: string) => {
        if (!userId) {
          setDirectMessages([]);
          return;
        }
        const { data, error } = await supabase
          .from('direct_messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        if (!error && data) {
          setDirectMessages(data.map((item: any) => ({
            id: item.id,
            senderId: item.sender_id,
            receiverId: item.receiver_id,
            text: item.text,
            timestamp: item.timestamp,
            read: item.read
          })));
        } else if (error) {
          console.warn("Table 'direct_messages' non configurée dans Supabase, utilisation du stockage local :", error.message);
        }
      };

      const loadProfiles = async (isAdmin = false) => {
        const selectFields = isAdmin 
          ? 'id, name, email, phone, role, verified, avatar, trust_score, badges, bio, address, country, region, verification_status, cni_number, dob, account_type, following, followers, created_at, funds_available, kyc_reject_reason'
          : 'id, name, role, verified, avatar, trust_score, badges, bio, country, region, account_type';

        const { data, error } = await supabase
          .from('profiles')
          .select(selectFields);
        if (!error && data) {
          setUsersList(data.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email || '',
            phone: p.phone || '',
            role: p.role || 'citizen',
            verified: p.verified || false,
            avatar: p.avatar || '',
            trustScore: p.trust_score || 50,
            badges: p.badges || [],
            bio: p.bio || '',
            address: p.address || '',
            country: p.country || '',
            region: p.region || '',
            idCardRecto: '',
            idCardVerso: '',
            selfie: '',
            verificationStatus: p.verification_status || 'none',
            cniNumber: p.cni_number || '',
            dob: p.dob || '',
            following: p.following || [],
            followers: p.followers || [],
            availableFunds: Number(p.funds_available || 0),
            kycRejectReason: p.kyc_reject_reason || ''
          })));
        }
      };

      const loadWithdrawalRequests = async (userId?: string, isAdmin = false) => {
        if (!userId) {
          setWithdrawalRequests([]);
          return [];
        }
        let query = supabase.from('withdrawal_requests').select('*');
        if (!isAdmin) {
          query = query.eq('user_id', userId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            amount: Number(item.amount),
            method: item.method,
            phone: item.phone,
            status: item.status,
            createdAt: item.created_at
          }));
          setWithdrawalRequests(mapped);
          return mapped;
        }
        return [];
      };

      // Load all data from Supabase - 100% blocking under the Splash Screen
      const loadAllData = async () => {
        try {
          // 1. Recover auth session and sync user profile first
          const { data: { session } } = await supabase.auth.getSession();
          let isUserAdmin = false;
          let sessionUserId = '';
          if (session) {
            const profile = await syncUserSession(session);
            isUserAdmin = profile?.role === 'admin' || session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            sessionUserId = session.user.id;
          }

          // 2. Fetch ALL database tables in parallel
          const [
            petitionsList,
            cagnottesList,
            volunteerMissionsList,
            _tontinesList,
            _profilesList,
            _applicationsList,
            _messagesList,
            _withdrawalsList
          ] = await Promise.all([
            loadPetitions(),
            loadCagnottes(),
            loadVolunteerMissions(),
            loadTontines(),
            loadProfiles(isUserAdmin),
            loadVolunteerApplications(),
            loadDirectMessages(sessionUserId),
            loadWithdrawalRequests(sessionUserId, isUserAdmin)
          ]);

          // 3. Preload ALL active cover image assets to guarantee 0ms loading layout shifts
          const urlsToPreload: string[] = [];
          
          if (Array.isArray(petitionsList)) {
            petitionsList.filter(p => p.status === 'active').forEach(p => {
              if (p.coverImage && !urlsToPreload.includes(p.coverImage)) {
                urlsToPreload.push(p.coverImage);
              }
            });
          }
          if (Array.isArray(cagnottesList)) {
            cagnottesList.filter(c => c.status === 'active').forEach(c => {
              if (c.coverImage && !urlsToPreload.includes(c.coverImage)) {
                urlsToPreload.push(c.coverImage);
              }
            });
          }
          if (Array.isArray(volunteerMissionsList)) {
            volunteerMissionsList.filter(m => m.status === 'active').forEach(m => {
              if (m.coverImage && !urlsToPreload.includes(m.coverImage)) {
                urlsToPreload.push(m.coverImage);
              }
            });
          }

          if (urlsToPreload.length > 0) {
            console.log(`🖼️ Pré-chargement absolu de ${urlsToPreload.length} images de couverture actives...`);
            await Promise.all(
              urlsToPreload.map(url => new Promise<void>((resolve) => {
                if (!url || url.trim() === '' || url.startsWith('data:')) {
                  resolve();
                  return;
                }
                const timeout = setTimeout(() => {
                  console.warn(`⏳ Image preloading timed out: ${url}`);
                  resolve(); // Resolve to avoid blocking startup indefinitely
                }, 6000);

                const img = new Image();
                img.src = url;
                img.onload = () => {
                  clearTimeout(timeout);
                  resolve();
                };
                img.onerror = () => {
                  clearTimeout(timeout);
                  resolve();
                };
              }))
            );
            console.log('🖼️ Tous les visuels de couverture ont été téléchargés et mis en cache !');
          }
        } catch (err) {
          console.error("Erreur de chargement initial Supabase :", err);
        } finally {
          // 4. Mark all data as loaded so Splash Screen disappears
          setIsDataLoaded(true);
          console.log('⚡ Splash screen libéré ! Toutes les données (y compris profils, tontines et messages) et images de couverture actives sont prêtes.');
        }
      };

      // DETECT AND CONNECT SUPABASE
      useEffect(() => {
        setUseSupabase(true);

        // Realtime subscriptions
      const petitionsSub = supabase
        .channel('realtime:petitions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'petitions' }, (payload: any) => {
          loadPetitions();
          if (payload.eventType === 'INSERT') {
            const newPet = payload.new;
            const curUser = currentUserRef.current;
            if (newPet && curUser) {
              const organizerId = newPet.organizer?.id;
              if (organizerId && curUser.following?.includes(organizerId)) {
                triggerPushNotification(
                  `📢 Nouvelle pétition de ${newPet.organizer.name}`,
                  `Vient de publier : "${newPet.title}"`
                );
              }
            }
          }
        })
        .subscribe();

      const cagnottesSub = supabase
        .channel('realtime:cagnottes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cagnottes' }, (payload: any) => {
          loadCagnottes();
          if (payload.eventType === 'INSERT') {
            const newCag = payload.new;
            const curUser = currentUserRef.current;
            if (newCag && curUser) {
              const organizerId = newCag.organizer?.id;
              if (organizerId && curUser.following?.includes(organizerId)) {
                triggerPushNotification(
                  `🪙 Nouvelle cagnotte de ${newCag.organizer.name}`,
                  `Vient de publier : "${newCag.title}"`
                );
              }
            }
          }
        })
        .subscribe();

      const tontinesSub = supabase
        .channel('realtime:tontines')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tontines' }, () => {
          loadTontines();
        })
        .subscribe();

      const volunteerMissionsSub = supabase
        .channel('realtime:volunteer_missions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_missions' }, (payload: any) => {
          loadVolunteerMissions();
          if (payload.eventType === 'INSERT') {
            const newMis = payload.new;
            const curUser = currentUserRef.current;
            if (newMis && curUser) {
              const organizerId = newMis.organizer?.id;
              if (organizerId && curUser.following?.includes(organizerId)) {
                triggerPushNotification(
                  `🛠️ Nouvelle mission de ${newMis.organizer.name}`,
                  `Vient de publier : "${newMis.title}"`
                );
              }
            }
          }
        })
        .subscribe();

      const volunteerApplicationsSub = supabase
        .channel('realtime:volunteer_applications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_applications' }, () => {
          loadVolunteerApplications();
        })
        .subscribe();

      const directMessagesSub = supabase
        .channel('realtime:direct_messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
          loadDirectMessages(currentUserRef.current?.id);
        })
        .subscribe();

      const profilesSub = supabase
        .channel('realtime:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload: any) => {
          loadProfiles(currentUserRef.current?.role === 'admin');
          if (payload.new) {
            const p = payload.new;
            setCurrentUser(prev => {
              if (prev && p.id === prev.id) {
                return {
                  ...prev,
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
                  verificationStatus: p.verification_status || 'none',
                  cniNumber: p.cni_number,
                  dob: p.dob,
                  following: p.following || [],
                  followers: p.followers || [],
                  availableFunds: Number(p.funds_available || 0),
                  kycRejectReason: p.kyc_reject_reason || ''
                };
              }
              return prev;
            });
          }
        })
        .subscribe();

      const withdrawalRequestsSub = supabase
        .channel('realtime:withdrawal_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawal_requests' }, () => {
          loadWithdrawalRequests(currentUserRef.current?.id, currentUserRef.current?.role === 'admin');
        })
        .subscribe();

      return () => {
        supabase.removeChannel(petitionsSub);
        supabase.removeChannel(cagnottesSub);
        supabase.removeChannel(tontinesSub);
        supabase.removeChannel(volunteerMissionsSub);
        supabase.removeChannel(volunteerApplicationsSub);
        supabase.removeChannel(directMessagesSub);
        supabase.removeChannel(profilesSub);
        supabase.removeChannel(withdrawalRequestsSub);
      };
  }, []);

  // Listen to Supabase Auth State changes for secure session recovery
  useEffect(() => {
    const isConfigured = true;

    if (isConfigured) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        syncUserSession(session).then(() => {
          loadAllData();
        });
      });

      // Listen for auth events
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        syncUserSession(session).then(() => {
          loadAllData();
        });
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
      setIsMobileView(window.innerWidth < 834);
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
  }, [usersList]);

  useEffect(() => {
    try {
      localStorage.setItem('sc_petitions', JSON.stringify(petitions));
    } catch (e) {
      console.error("Failed to save petitions to storage:", e);
    }
  }, [petitions]);

  useEffect(() => {
    try {
      localStorage.setItem('sc_cagnottes', JSON.stringify(cagnottes));
    } catch (e) {
      console.error("Failed to save cagnottes to storage:", e);
    }
  }, [cagnottes]);

  useEffect(() => {
    try {
      localStorage.setItem('sc_tontines_list', JSON.stringify(tontines));
    } catch (e) {
      console.error("Failed to save tontines to storage:", e);
    }
  }, [tontines]);

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
    playChimeSound();
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

  const prevFollowersRef = React.useRef<string[]>([]);
  useEffect(() => {
    if (currentUser) {
      const prevFollowers = prevFollowersRef.current;
      const currentFollowers = currentUser.followers || [];
      const newFollowers = currentFollowers.filter(id => !prevFollowers.includes(id));
      if (prevFollowers.length > 0 && newFollowers.length > 0) {
        newFollowers.forEach(followerId => {
          const follower = usersList.find(u => u.id === followerId);
          if (follower) {
            triggerPushNotification("Nouvel abonné", `${follower.name} a commencé à vous suivre.`);
          } else {
            triggerPushNotification("Nouvel abonné", `Un utilisateur a commencé à vous suivre.`);
          }
        });
      }
      prevFollowersRef.current = currentFollowers;
    } else {
      prevFollowersRef.current = [];
    }
  }, [currentUser?.followers, usersList]);

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

  // FCM PUSH NOTIFICATIONS
  const registerFcmToken = async (userId: string) => {
    if (!messaging) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const REAL_VAPID_KEY = 'BFtOahXP3492CcOIZe1V9_7_6FKgulXUbcENVLZh5xIi7w2N-iY9GUp_MvQJ1jPKK-8ldZTU1xVK4aRGlilhmFQ';
        const rawVapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        const vapidKey = (rawVapidKey && rawVapidKey !== 'BFGv54e4vPzN2TebxP34ZPlgN4f...') ? rawVapidKey : REAL_VAPID_KEY;

        const token = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          vapidKey: vapidKey
        });

        if (token) {
          console.log('FCM Token récupéré :', token);
          const { error } = await supabase
            .from('profiles')
            .update({ fcm_token: token })
            .eq('id', userId);
          
          if (error) {
            console.warn("Impossible d'enregistrer le token FCM dans profiles (migration SQL nécessaire) :", error.message);
          } else {
            console.log("Token FCM enregistré dans la table profiles !");
          }
        }
      }
    } catch (err) {
      console.warn("Échec de récupération du token FCM :", err);
    }
  };

  const sendPushToUser = async (userId: string, title: string, body: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('fcm_token')
        .eq('id', userId)
        .single();
      
      if (error || !data || !data.fcm_token) {
        console.log(`Aucun token FCM trouvé pour l'utilisateur ${userId}`);
        return;
      }

      const fcmToken = data.fcm_token;
      
      // Récupération sécurisée du jeton d'accès utilisateur pour l'API
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Appel de la fonction serverless Vercel sécurisée
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          token: fcmToken,
          title,
          body
        })
      });

      if (response.ok) {
        console.log(`Push notification envoyée via Vercel FCM v1 API à ${userId}`);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Échec de l'envoi du push via l'API Vercel pour ${userId} :`, errData);
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du push FCM via Vercel :", err);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.id) {
      registerFcmToken(currentUser.id);
    }
  }, [currentUser?.id]);

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
      try {
        const { data: pet, error: fetchErr } = await supabase
          .from('petitions')
          .select('signatures_count, signers')
          .eq('id', id)
          .single();
        
        if (!fetchErr && pet) {
          const currentSigners = pet.signers || [];
          const alreadySigned = currentSigners.some((s: any) => s.name.toLowerCase() === name.toLowerCase());
          if (!alreadySigned) {
            const newSigner = { name, date: new Date().toISOString().split('T')[0], badge: 'Citoyen' };
            const updatedSigners = [newSigner, ...currentSigners];
            const newCount = Number(pet.signatures_count || 0) + 1;
            
            const { error: updateErr } = await supabase
              .from('petitions')
              .update({
                signatures_count: newCount,
                signers: updatedSigners
              })
              .eq('id', id);
              
            if (updateErr) {
              console.error("Error signing in Supabase:", updateErr);
            }
          }
        }
      } catch (err) {
        console.error("Error signing in Supabase:", err);
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
      try {
        const { data: cag, error: fetchErr } = await supabase
          .from('cagnottes')
          .select('amount_collected, donors')
          .eq('id', id)
          .single();
        
        if (!fetchErr && cag) {
          const currentDonors = cag.donors || [];
          const newDonor = { name, amount, date: new Date().toISOString().split('T')[0], comment, isDiaspora };
          const updatedDonors = [newDonor, ...currentDonors];
          const newAmount = Number(cag.amount_collected || 0) + amount;
          
          const { error: updateErr } = await supabase
            .from('cagnottes')
            .update({
              amount_collected: newAmount,
              donors: updatedDonors
            })
            .eq('id', id);
            
          if (updateErr) {
            console.error("Error donating in Supabase:", updateErr);
          }
        }
      } catch (err) {
        console.error("Error donating in Supabase:", err);
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

    if (useSupabase) {
      supabase.from('volunteer_applications').insert([{
        id: newApp.id,
        mission_id: newApp.missionId,
        user_name: newApp.userName,
        user_email: newApp.userEmail,
        user_phone: newApp.userPhone,
        message: newApp.message,
        applied_at: newApp.appliedAt,
        status: newApp.status
      }]).then(({ error }) => {
        if (error) console.error("Error creating volunteer application in Supabase:", error);
      });

      supabase.from('volunteer_missions').select('volunteers_count').eq('id', id).single().then(({ data, error }) => {
        if (!error && data) {
          const newCount = Number(data.volunteers_count || 0) + 1;
          supabase.from('volunteer_missions')
            .update({ volunteers_count: newCount })
            .eq('id', id)
            .then(({ error: updErr }) => {
              if (updErr) console.error("Error updating volunteers_count in Supabase:", updErr);
            });
        }
      });
    }

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

  const createPetition = async (petitionData: Omit<Petition, 'id' | 'signaturesCount' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'signers'>): Promise<string> => {
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

    if (useSupabase) {
      const { error } = await supabase.from('petitions').insert([{
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
        viewed_by_admin: false,
        image_before: newPet.imageBefore || '',
        image_after: newPet.imageAfter || '',
        gallery: newPet.gallery || []
      }]);
      
      if (error) {
        console.error("Error creating petition in Supabase: ", error);
        addNotification(`❌ Échec de la publication de la pétition : ${error.message}`);
        return '';
      }
    }

    setPetitions(prev => [newPet, ...prev]);

    // Notify followers
    const followers = currentUser.followers || [];
    followers.forEach((followerId: string) => {
      sendPushToUser(
        followerId,
        `📢 Nouvelle pétition de ${currentUser.name}`,
        `Vient de publier : "${newPet.title}"`
      );
    });

    // Unlock Leader badge
    if (!currentUser.badges.includes('leader')) {
      const updatedUser: User = { ...currentUser, badges: [...currentUser.badges, 'leader'] };
      setCurrentUser(updatedUser);
      addNotification('🎉 Badge Débloqué : Leader !');
    }

    addNotification('Pétition soumise ! Suivez son statut de modération en temps réel.');
    return newId;
  };

  const createCagnotte = async (cagnotteData: Omit<Cagnotte, 'id' | 'amountCollected' | 'createdAt' | 'status' | 'organizer' | 'updates' | 'expenses' | 'donors'>): Promise<string> => {
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

    if (useSupabase) {
      const { error } = await supabase.from('cagnottes').insert([{
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
        viewed_by_admin: false,
        image_before: newCag.imageBefore || '',
        image_after: newCag.imageAfter || ''
      }]);
      
      if (error) {
        console.error("Error creating cagnotte in Supabase: ", error);
        addNotification(`❌ Échec de la création de la cagnotte : ${error.message}`);
        return '';
      }
    }

    setCagnottes(prev => [newCag, ...prev]);

    // Notify followers
    const followers = currentUser.followers || [];
    followers.forEach((followerId: string) => {
      sendPushToUser(
        followerId,
        `🪙 Nouvelle cagnotte de ${currentUser.name}`,
        `Vient de publier : "${newCag.title}"`
      );
    });

    // Unlock Leader badge
    if (!currentUser.badges.includes('leader')) {
      const updatedUser: User = { ...currentUser, badges: [...currentUser.badges, 'leader'] };
      setCurrentUser(updatedUser);
      addNotification('🎉 Badge Débloqué : Leader !');
    }

    addNotification('Cagnotte créée ! Suivez son statut de modération en temps réel.');
    return newId;
  };

  const saveTontine = async (tontine: Tontine): Promise<boolean> => {
    // Update local state first for immediate UI responsiveness
    setTontines(prev => {
      const idx = prev.findIndex(t => t.id === tontine.id);
      let updated;
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = tontine;
      } else {
        updated = [tontine, ...prev];
      }
      localStorage.setItem('sc_tontines_list', JSON.stringify(updated));
      return updated;
    });

    if (useSupabase) {
      try {
        const dbTontine = {
          id: tontine.id,
          name: tontine.name,
          description: tontine.description,
          type: tontine.type,
          participants_max: tontine.participantsMax,
          joined_count: tontine.joinedCount,
          cotisation: tontine.cotisation,
          frequency: tontine.frequency,
          start_date: tontine.startDate,
          end_date: tontine.endDate,
          order_type: tontine.orderType,
          status: tontine.status,
          organizer: tontine.organizer,
          members: tontine.members,
          payments: tontine.payments,
          activity_logs: tontine.activityLogs,
          votes: tontine.votes,
          chat: tontine.chat,
          guarantee_fund_active: tontine.guaranteeFundActive,
          guarantee_fund_amount: tontine.guaranteeFundAmount,
          guarantee_fund_total: tontine.guaranteeFundTotal,
          accumulated_savings: tontine.accumulatedSavings || 0,
          cover_image: tontine.coverImage || ''
        };

        const { error } = await supabase
          .from('tontines')
          .upsert([dbTontine]);
        
        if (error) {
          console.error("Erreur lors de la sauvegarde de la tontine dans Supabase :", error);
          return false;
        }
        return true;
      } catch (err) {
        console.error("Erreur de sauvegarde Supabase :", err);
        return false;
      }
    }
    return true;
  };

  // Handle PayTech Payment success/cancel redirects on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paytechSuccess = params.get('paytech_success');
    const paytechCancel = params.get('paytech_cancel');
    const paytechRef = params.get('ref');

    const cleanUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('paytech_success');
      url.searchParams.delete('paytech_cancel');
      url.searchParams.delete('ref');
      url.searchParams.delete('amount');
      window.history.replaceState({}, '', url.pathname + url.search);
    };

    if (paytechSuccess === 'true' && paytechRef) {
      const pendingStr = localStorage.getItem('pending_payment');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          if (pending.refCommand === paytechRef) {
            // Match found! Process payment based on type
            if (pending.type === 'cagnotte') {
              donateToCagnotte(
                pending.cagnotteId,
                pending.amount,
                pending.donorName,
                pending.comment,
                pending.isDiaspora,
                'PayTech'
              ).then((ok) => {
                if (ok) {
                  addNotification(`🎉 Don de ${pending.amount.toLocaleString('fr-FR')} FCFA validé avec succès via PayTech !`);
                }
              });
            } else if (pending.type === 'tontine') {
              // Tontine payment confirmation
              const targetTontine = tontines.find(t => t.id === pending.tontineId);
              if (targetTontine) {
                const now = new Date();
                const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
                const mockIP = '197.35.' + Math.floor(10 + Math.random() * 200) + '.' + Math.floor(10 + Math.random() * 200);
                const randomHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');

                const newPay: PaymentRecord = {
                  id: `pay_${Date.now()}`,
                  date: now.toISOString().split('T')[0],
                  amount: pending.amount,
                  payer: pending.payerName || 'Membre',
                  beneficiary: targetTontine.members[0]?.name || 'Organisateur',
                  status: 'paid',
                  transactionId: paytechRef,
                  method: pending.selectedPaymentMethod.toUpperCase(),
                  timestamp: timestampStr,
                  ipAddress: mockIP,
                  proofHash: randomHash
                };

                const newLog: ActivityLog = {
                  id: `log_${Date.now()}`,
                  timestamp: timestampStr,
                  type: 'paiement',
                  user: pending.payerName || 'Membre',
                  details: pending.penalties && pending.penalties > 0
                    ? `Cotisation de ${pending.amount.toLocaleString('fr-FR')} F (comprenant ${pending.penalties.toLocaleString('fr-FR')} F de pénalités de retard) validée via ${newPay.method} (PayTech). Réf: ${paytechRef}`
                    : `Cotisation de ${pending.amount.toLocaleString('fr-FR')} F validée via ${newPay.method} (PayTech). Réf: ${paytechRef}`
                };

                const updatedMembers = targetTontine.members.map(m => {
                  if (m.name?.toLowerCase() === (pending.payerName || '').toLowerCase()) {
                    return { 
                      ...m, 
                      hasPaidThisRound: true, 
                      rate: Math.min(100, m.rate + (pending.penalties ? 2 : 1)),
                      penalties: 0,
                      reputation: m.reputation === 'surveillance' ? 'fiable' as const : m.reputation
                    };
                  }
                  return m;
                });

                const updatedTontine = {
                  ...targetTontine,
                  payments: [newPay, ...targetTontine.payments],
                  activityLogs: [newLog, ...targetTontine.activityLogs],
                  members: updatedMembers,
                  accumulatedSavings: (targetTontine.accumulatedSavings || 0) + pending.amount
                };

                saveTontine(updatedTontine).then((ok) => {
                  if (ok) {
                    const payMsg = pending.penalties && pending.penalties > 0
                      ? `💰 Cotisation et pénalités de ${pending.amount.toLocaleString('fr-FR')} FCFA validées avec succès via PayTech !`
                      : `💰 Cotisation de ${pending.amount.toLocaleString('fr-FR')} FCFA validée avec succès via PayTech !`;
                    addNotification(payMsg);
                  }
                });
              }
            }
          }
        } catch (e) {
          console.error("Error parsing pending payment info:", e);
        } finally {
          localStorage.removeItem('pending_payment');
          cleanUrl();
        }
      }
    } else if (paytechCancel === 'true') {
      addNotification("❌ Paiement annulé par l'utilisateur.");
      localStorage.removeItem('pending_payment');
      cleanUrl();
    }
  }, [tontines, useSupabase]);

  const createVolunteerMission = async (missionData: Omit<VolunteerMission, 'id' | 'volunteersCount' | 'createdAt' | 'organizer' | 'status'>): Promise<string> => {
    if (!currentUser) return '';
    const newId = `vol_${Math.random().toString(36).substr(2, 9)}`;
    const newMis: VolunteerMission = {
      ...missionData,
      id: newId,
      volunteersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active',
      organizer: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      }
    };

    if (useSupabase) {
      const { error } = await supabase.from('volunteer_missions').insert([{
        id: newId,
        title: newMis.title,
        description: newMis.description,
        cover_image: newMis.coverImage,
        location: newMis.location,
        duration: newMis.duration,
        needs: newMis.needs,
        category: newMis.category,
        volunteers_target: newMis.volunteersTarget,
        volunteers_count: 0,
        organizer: newMis.organizer,
        created_at: newMis.createdAt,
        status: 'active',
        image_before: newMis.imageBefore || '',
        image_after: newMis.imageAfter || ''
      }]);
      
      if (error) {
        console.error("Error creating volunteer mission in Supabase:", error);
        addNotification(`❌ Échec de la publication de la mission : ${error.message}`);
        return '';
      }
    }

    setVolunteerMissions(prev => [newMis, ...prev]);

    // Notify followers
    const followers = currentUser.followers || [];
    followers.forEach((followerId: string) => {
      sendPushToUser(
        followerId,
        `🛠️ Nouvelle mission de ${currentUser.name}`,
        `Vient de publier : "${newMis.title}"`
      );
    });

    addNotification('Mission bénévole publiée avec succès.');
    return newId;
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

    // Trigger follower notifications in-app and via FCM push
    setTimeout(() => {
      if (organizerId && currentUser?.following?.includes(organizerId)) {
        triggerPushNotification(
          `📢 Nouveau projet de ${organizerName}`,
          `Vient de lancer la campagne : "${title}"`
        );
      }
    }, 1000);

    if (organizerId) {
      supabase.from('profiles').select('followers').eq('id', organizerId).single().then(({ data }) => {
        if (data && data.followers) {
          data.followers.forEach((followerId: string) => {
            sendPushToUser(
              followerId,
              `📢 Nouveau projet de ${organizerName}`,
              `Vient de lancer la campagne : "${title}"`
            );
          });
        }
      });
    }
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

  const deletePublication = async (id: string, type: 'petition' | 'cagnotte' | 'volunteer_mission' | 'tontine'): Promise<boolean> => {
    try {
      if (useSupabase) {
        if (type === 'petition') {
          const { data, error } = await supabase.from('petitions').delete().eq('id', id).select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Permissions insuffisantes ou publication inexistante.");
          }
        } else if (type === 'cagnotte') {
          const { data, error } = await supabase.from('cagnottes').delete().eq('id', id).select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Permissions insuffisantes ou publication inexistante.");
          }
        } else if (type === 'volunteer_mission') {
          // Delete referencing volunteer applications first
          await supabase.from('volunteer_applications').delete().eq('mission_id', id);
          
          const { data, error } = await supabase.from('volunteer_missions').delete().eq('id', id).select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Permissions insuffisantes ou publication inexistante.");
          }
        } else if (type === 'tontine') {
          const { data, error } = await supabase.from('tontines').delete().eq('id', id).select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error("Permissions insuffisantes ou tontine inexistante.");
          }
        }
      }

      // Update local state
      if (type === 'petition') {
        setPetitions(prev => prev.filter(p => p.id !== id));
      } else if (type === 'cagnotte') {
        setCagnottes(prev => prev.filter(c => c.id !== id));
      } else if (type === 'volunteer_mission') {
        setVolunteerMissions(prev => prev.filter(m => m.id !== id));
      } else if (type === 'tontine') {
        setTontines(prev => prev.filter(t => t.id !== id));
      }

      addNotification('La publication a été supprimée avec succès.');
      return true;
    } catch (err: any) {
      console.error(`Error deleting publication (${type}):`, err);
      alert(`Erreur lors de la suppression de la publication : ${err.message}`);
      return false;
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
      supabase.from(tableName).select('updates').eq('id', id).single().then(({ data, error }) => {
        if (!error && data) {
          const currentUpdates = data.updates || [];
          const updatedUpdates = [newUpdate, ...currentUpdates];
          supabase.from(tableName).update({
            updates: updatedUpdates
          }).eq('id', id).then(({ error: updErr }) => {
            if (updErr) console.error("Error adding update in Supabase: ", updErr);
          });
        }
      });
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
      supabase.from('cagnottes').select('expenses').eq('id', cagnotteId).single().then(({ data, error }) => {
        if (!error && data) {
          const currentExpenses = data.expenses || [];
          const updatedExpenses = [newExpense, ...currentExpenses];
          supabase.from('cagnottes').update({
            expenses: updatedExpenses
          }).eq('id', cagnotteId).then(({ error: updErr }) => {
            if (updErr) console.error("Error adding expense in Supabase: ", updErr);
          });
        }
      });
    }
  };

  const updateCampaignAfterImage = async (id: string, type: 'petition' | 'cagnotte' | 'volunteer', imageAfter: string): Promise<boolean> => {
    if (type === 'petition') {
      setPetitions(prev => prev.map(p => p.id === id ? { ...p, imageAfter } : p));
      if (useSupabase) {
        const { error } = await supabase.from('petitions').update({ image_after: imageAfter }).eq('id', id);
        if (error) console.error("Error updating petition after image:", error);
      }
    } else if (type === 'cagnotte') {
      setCagnottes(prev => prev.map(c => c.id === id ? { ...c, imageAfter } : c));
      if (useSupabase) {
        const { error } = await supabase.from('cagnottes').update({ image_after: imageAfter }).eq('id', id);
        if (error) console.error("Error updating cagnotte after image:", error);
      }
    } else if (type === 'volunteer') {
      setVolunteerMissions(prev => prev.map(m => m.id === id ? { ...m, imageAfter } : m));
      if (useSupabase) {
        const { error } = await supabase.from('volunteer_missions').update({ image_after: imageAfter }).eq('id', id);
        if (error) console.error("Error updating mission after image:", error);
      }
    }
    addNotification('Image après contribution mise à jour avec succès.');
    return true;
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
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@sunuyite.com';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || '';

    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass
        });
        if (error) {
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
              accountType: profile.account_type || 'citizen',
              following: profile.following || [],
              followers: profile.followers || [],
              availableFunds: Number(profile.funds_available || 0),
              kycRejectReason: profile.kyc_reject_reason || ''
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
              avatar: data.user.user_metadata?.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy-yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==',
              country: data.user.user_metadata?.country || 'Sénégal',
              region: data.user.user_metadata?.region || 'Dakar',
              verification_status: isSessionAdmin ? 'verified' : 'none',
              account_type: data.user.user_metadata?.account_type || 'citizen'
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
              accountType: fallbackProfile.account_type as 'citizen' | 'company' | 'ngo',
              following: [],
              followers: [],
              availableFunds: 0,
              kycRejectReason: ''
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
        availableFunds: existingAdmin?.availableFunds || 0,
        kycRejectReason: existingAdmin?.kycRejectReason || '',
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
        followers: [],
        availableFunds: 0,
        kycRejectReason: ''
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
            emailRedirectTo: window.location.origin,
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
            followers: [],
            availableFunds: 0,
            kycRejectReason: ''
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
    const tontinesCount = tontines.filter((t: any) => 
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

    if (useSupabase) {
      supabase.from('direct_messages').insert([{
        id: newMsg.id,
        sender_id: newMsg.senderId,
        receiver_id: newMsg.receiverId,
        text: newMsg.text,
        timestamp: newMsg.timestamp,
        read: newMsg.read
      }]).then(({ error }) => {
        if (error) console.error("Error creating direct message in Supabase:", error);
      });
    }

    // Déclenchement de la notification push FCM au destinataire
    sendPushToUser(receiverId, `💬 Message de ${currentUser.name}`, text);

    // Simulate auto-reply ONLY if the receiver is an administrator
    const receiver = usersList.find(u => u.id === receiverId);
    const isReceiverAdmin = receiver?.role === 'admin' || 
                           receiver?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (isReceiverAdmin) {
      setTimeout(() => {
        const receiverName = receiver ? receiver.name : "Administrateur";
        const autoReplyText = `Merci pour votre message ! Notre équipe administrative a bien reçu votre message. Dès que nous serons disponibles, nous vous répondrons.`;
        
        const replyMsg: DirectMessage = {
          id: `msg_${Date.now() + 1}`,
          senderId: receiverId,
          receiverId: currentUser.id,
          text: autoReplyText,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          read: false
        };
        
        setDirectMessages(prev => [...prev, replyMsg]);

        if (useSupabase) {
          supabase.from('direct_messages').insert([{
            id: replyMsg.id,
            sender_id: replyMsg.senderId,
            receiver_id: replyMsg.receiverId,
            text: replyMsg.text,
            timestamp: replyMsg.timestamp,
            read: replyMsg.read
          }]).then(({ error }) => {
            if (error) console.error("Error creating reply message in Supabase:", error);
          });
        }

        triggerPushNotification(`💬 Message de ${receiverName}`, autoReplyText);
      }, 3000);
    }
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
      if (updates.availableFunds !== undefined) supabaseUpdates.funds_available = updates.availableFunds;
      if (updates.kycRejectReason !== undefined) supabaseUpdates.kyc_reject_reason = updates.kycRejectReason;
      
      // Sanitization fields
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.avatar !== undefined) supabaseUpdates.avatar = updates.avatar;
      if (updates.bio !== undefined) supabaseUpdates.bio = updates.bio;
      if (updates.address !== undefined) supabaseUpdates.address = updates.address;
      if (updates.country !== undefined) supabaseUpdates.country = updates.country;
      if (updates.region !== undefined) supabaseUpdates.region = updates.region;
      if (updates.idCardRecto !== undefined) supabaseUpdates.id_card_recto = updates.idCardRecto;
      if (updates.idCardVerso !== undefined) supabaseUpdates.id_card_verso = updates.idCardVerso;
      if (updates.selfie !== undefined) supabaseUpdates.selfie = updates.selfie;
      if (updates.cniNumber !== undefined) supabaseUpdates.cni_number = updates.cniNumber;

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

    if (useSupabase) {
      try {
        // Enregistrer dans Supabase pour l'utilisateur actuel
        const { error: err1 } = await supabase
          .from('profiles')
          .update({ following: updatedFollowing })
          .eq('id', currentUser.id);

        if (err1) console.error("Error updating following list in Supabase:", err1);

        // Récupérer les abonnés actuels de la cible pour éviter les écrasements
        const { data: targetProfile, error: fetchErr } = await supabase
          .from('profiles')
          .select('followers')
          .eq('id', userId)
          .single();

        if (!fetchErr && targetProfile) {
          const currentTargetFollowers = targetProfile.followers || [];
          if (!currentTargetFollowers.includes(currentUser.id)) {
            const finalFollowers = [...currentTargetFollowers, currentUser.id];
            const { error: err2 } = await supabase
              .from('profiles')
              .update({ followers: finalFollowers })
              .eq('id', userId);
            if (err2) console.error("Error updating followers list in Supabase:", err2);
          }
        }
      } catch (err) {
        console.error("Error persisting follow in Supabase:", err);
      }
    }

    // Envoi de la notification push FCM réelle à l'utilisateur cible
    sendPushToUser(userId, "Nouvel abonné", `${currentUser.name} a commencé à vous suivre.`);

    setTimeout(() => {
      const targetUser = usersList.find(u => u.id === userId);
      if (targetUser) {
        triggerPushNotification(
          `Abonnement`,
          `Vous êtes maintenant abonné aux publications de ${targetUser.name}.`
        );
      }
    }, 1000);

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

    if (useSupabase) {
      try {
        const { error: err1 } = await supabase
          .from('profiles')
          .update({ following: updatedFollowing })
          .eq('id', currentUser.id);

        if (err1) console.error("Error updating following list in Supabase:", err1);

        const { data: targetProfile, error: fetchErr } = await supabase
          .from('profiles')
          .select('followers')
          .eq('id', userId)
          .single();

        if (!fetchErr && targetProfile) {
          const currentTargetFollowers = targetProfile.followers || [];
          const finalFollowers = currentTargetFollowers.filter((id: string) => id !== currentUser.id);
          const { error: err2 } = await supabase
            .from('profiles')
            .update({ followers: finalFollowers })
            .eq('id', userId);
          if (err2) console.error("Error updating followers list in Supabase:", err2);
        }
      } catch (err) {
        console.error("Error persisting unfollow in Supabase:", err);
      }
    }

    return true;
  };

  const loadPetitionDetails = async (id: string) => {
    if (!useSupabase) return;
    try {
      const { data, error } = await supabase
        .from('petitions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        const mapped = {
          id: data.id,
          title: data.title,
          description: data.description,
          coverImage: data.cover_image,
          category: data.category,
          signaturesCount: data.signatures_count,
          signaturesTarget: data.signatures_target,
          recipient: data.recipient,
          location: data.location,
          dateLimit: data.date_limit,
          createdAt: data.created_at,
          status: data.status,
          organizer: data.organizer,
          updates: data.updates || [],
          signers: data.signers || [],
          boosted: data.boosted,
          boostLevel: data.boost_level,
          viewedByAdmin: data.viewed_by_admin,
          rejectionFeedback: data.rejection_feedback,
          imageBefore: data.image_before || '',
          imageAfter: data.image_after || '',
          gallery: data.gallery || []
        };
        setPetitions(prev => prev.map(p => p.id === id ? mapped : p));
      }
    } catch (err) {
      console.error("Error loading petition details:", err);
    }
  };

  const loadCagnotteDetails = async (id: string) => {
    if (!useSupabase) return;
    try {
      const { data, error } = await supabase
        .from('cagnottes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        const mapped = {
          id: data.id,
          title: data.title,
          description: data.description,
          coverImage: data.cover_image,
          category: data.category,
          amountCollected: Number(data.amount_collected || 0),
          amountTarget: Number(data.amount_target || 0),
          location: data.location,
          createdAt: data.created_at,
          status: data.status,
          organizer: data.organizer,
          isDiasporaTargeted: data.is_diaspora_targeted,
          updates: data.updates || [],
          expenses: data.expenses || [],
          donors: data.donors || [],
          documents: data.documents || [],
          gallery: data.gallery || [],
          viewedByAdmin: data.viewed_by_admin,
          rejectionFeedback: data.rejection_feedback,
          imageBefore: data.image_before || '',
          imageAfter: data.image_after || ''
        };
        setCagnottes(prev => prev.map(c => c.id === id ? mapped : c));
      }
    } catch (err) {
      console.error("Error loading cagnotte details:", err);
    }
  };

  const loadUserKycDocs = async (userId: string) => {
    if (!useSupabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id_card_recto, id_card_verso, selfie')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUsersList(prev => prev.map(u => u.id === userId ? {
          ...u,
          idCardRecto: data.id_card_recto || '',
          idCardVerso: data.id_card_verso || '',
          selfie: data.selfie || ''
        } : u));
      }
    } catch (err) {
      console.error("Error loading user KYC documents:", err);
    }
  };

  const playSynthesizedChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      
      // High pitch E6 (~1318Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.51, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
      
      // High pitch A6 (~1760Hz) starting shortly after
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760.00, now + 0.12);
      gain2.gain.setValueAtTime(0.1, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn("AudioContext playback blocked or failed:", e);
    }
  };

  const playChimeSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((err) => {
        console.warn("Custom notification sound blocked or not found, using synthesized fallback:", err);
        playSynthesizedChime();
      });
    } catch (e) {
      playSynthesizedChime();
    }
  };

  // Trigger sound chime when a new message is received for the current user
  const prevMessagesCountRef = React.useRef(directMessages.length);
  useEffect(() => {
    if (currentUser && directMessages.length > prevMessagesCountRef.current) {
      const newMessages = directMessages.slice(prevMessagesCountRef.current);
      const hasReceivedNewMessage = newMessages.some(m => m.receiverId === currentUser.id);
      if (hasReceivedNewMessage) {
        playChimeSound();
      }
    }
    prevMessagesCountRef.current = directMessages.length;
  }, [directMessages, currentUser?.id]);

  const submitWithdrawalRequest = async (amount: number, method: string, phone: string): Promise<boolean> => {
    if (!currentUser) {
      addNotification("⚠️ Connectez-vous d'abord pour faire une demande.");
      return false;
    }
    if (amount > currentUser.availableFunds) {
      addNotification("❌ Solde insuffisant pour cette demande de retrait.");
      return false;
    }
    
    const newRequest: WithdrawalRequest = {
      id: `wth_${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      amount,
      method,
      phone,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const newFunds = currentUser.availableFunds - amount;
    const updatedUser = { ...currentUser, availableFunds: newFunds };
    setCurrentUser(updatedUser);
    setUsersList(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setWithdrawalRequests(prev => [newRequest, ...prev]);
    
    if (useSupabase) {
      try {
        const { error: insertErr } = await supabase.from('withdrawal_requests').insert([{
          id: newRequest.id,
          user_id: newRequest.userId,
          amount: newRequest.amount,
          method: newRequest.method,
          phone: newRequest.phone,
          status: newRequest.status,
          created_at: newRequest.createdAt
        }]);
        if (insertErr) throw insertErr;
        
        const { error: profileErr } = await supabase.from('profiles').update({
          funds_available: newFunds
        }).eq('id', currentUser.id);
        if (profileErr) throw profileErr;
        
      } catch (err: any) {
        console.error("Error submitting withdrawal request:", err);
        addNotification(`❌ Échec de la demande de retrait : ${err.message}`);
        return false;
      }
    }
    addNotification("Demande de retrait soumise ! En attente de validation.");
    return true;
  };

  const submitTontinePayoutRequest = async (
    userId: string,
    amount: number,
    tontineName: string,
    phone: string
  ): Promise<boolean> => {
    const newRequest: WithdrawalRequest = {
      id: `wth_tontine_${Date.now()}`,
      userId,
      amount,
      method: `Wave (Tontine : ${tontineName})`,
      phone,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setWithdrawalRequests(prev => [newRequest, ...prev]);
    
    if (useSupabase) {
      try {
        const { error: insertErr } = await supabase.from('withdrawal_requests').insert([{
          id: newRequest.id,
          user_id: newRequest.userId,
          amount: newRequest.amount,
          method: newRequest.method,
          phone: newRequest.phone,
          status: newRequest.status,
          created_at: newRequest.createdAt
        }]);
        if (insertErr) throw insertErr;
      } catch (err: any) {
        console.error("Error submitting tontine payout request:", err);
        addNotification(`❌ Échec de l'enregistrement du payout : ${err.message}`);
        return false;
      }
    }
    addNotification("🏆 Payout de tontine soumis pour validation administrative !");
    return true;
  };

  const approveWithdrawalRequest = async (id: string): Promise<boolean> => {
    setWithdrawalRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
    
    if (useSupabase) {
      try {
        const { error } = await supabase.from('withdrawal_requests').update({
          status: 'approved'
        }).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Error approving withdrawal:", err);
        addNotification(`❌ Échec de l'approbation : ${err.message}`);
        return false;
      }
    }
    addNotification("Demande de retrait approuvée avec succès.");
    return true;
  };

  const rejectWithdrawalRequest = async (id: string): Promise<boolean> => {
    const request = withdrawalRequests.find(r => r.id === id);
    if (!request) return false;
    
    setWithdrawalRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
    
    const targetUser = usersList.find(u => u.id === request.userId);
    const isTontinePayout = request.method.includes('Tontine');

    if (targetUser && !isTontinePayout) {
      const newFunds = (targetUser.availableFunds || 0) + request.amount;
      const updatedUser = { ...targetUser, availableFunds: newFunds };
      setUsersList(prev => prev.map(u => u.id === request.userId ? updatedUser : u));
      if (currentUser && currentUser.id === request.userId) {
        setCurrentUser(updatedUser);
      }
      
      if (useSupabase) {
        try {
          const { error: profileErr } = await supabase.from('profiles').update({
            funds_available: newFunds
          }).eq('id', request.userId);
          if (profileErr) throw profileErr;
        } catch (err) {
          console.error("Error refunding user in Supabase:", err);
        }
      }
    }
    
    if (useSupabase) {
      try {
        const { error } = await supabase.from('withdrawal_requests').update({
          status: 'rejected'
        }).eq('id', id);
        if (error) throw error;
      } catch (err: any) {
        console.error("Error rejecting withdrawal:", err);
        addNotification(`❌ Échec du rejet : ${err.message}`);
        return false;
      }
    }
    addNotification(isTontinePayout ? "Demande de reversement de tontine rejetée." : "Demande de retrait rejetée et fonds remboursés.");
    return true;
  };

  const markMessagesAsRead = async (senderId: string): Promise<void> => {
    if (!currentUser) return;
    
    setDirectMessages(prev => prev.map(msg => 
      (msg.senderId === senderId && msg.receiverId === currentUser.id) ? { ...msg, read: true } : msg
    ));
    
    if (useSupabase) {
      try {
        const { error } = await supabase
          .from('direct_messages')
          .update({ read: true })
          .eq('sender_id', senderId)
          .eq('receiver_id', currentUser.id)
          .eq('read', false);
        if (error) throw error;
      } catch (err) {
        console.error("Error marking messages as read in Supabase:", err);
      }
    }
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
      tontines,
      saveTontine,
      volunteerMissions,
      volunteerApplications,
      badges: initialBadges,
      activeTheme,
      toggleTheme,
      isMobileView,
      setIsMobileView,
      notifications,
      addNotification,
      withdrawalRequests,
      submitWithdrawalRequest,
      submitTontinePayoutRequest,
      approveWithdrawalRequest,
      rejectWithdrawalRequest,
      markMessagesAsRead,
      
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
      deletePublication,
      resubmitCampaign,
      addCampaignUpdate,
      addCampaignExpense,
      updateCampaignAfterImage,
      
      // IA
      chatHistory,
      sendIAMessage,
      clearChat,
      
      // KPIs
      getKPIs,
      
      // PWA
      isInstallable,
      installApp,
      isDataLoaded,
      loadPetitionDetails,
      loadCagnotteDetails,
      loadUserKycDocs,
 
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
