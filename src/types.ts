export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'citizen' | 'organizer' | 'admin';
  verified: boolean;
  avatar: string;
  trustScore: number;
  badges: string[]; // Badge IDs
  bio?: string;
  address?: string;
  country?: string;
  region?: string;
  idCardRecto?: string;
  idCardVerso?: string;
  selfie?: string;
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  cniNumber?: string;
  dob?: string;
}

export interface Update {
  id: string;
  date: string;
  title: string;
  content: string;
  author: string;
  images?: string[];
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number; // in FCFA
  category: string;
  receiptUrl?: string; // mock URL
}

export interface Petition {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: 'sante' | 'education' | 'infrastructure' | 'environnement' | 'social';
  signaturesCount: number;
  signaturesTarget: number;
  recipient: string;
  location: string;
  dateLimit: string;
  createdAt: string;
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'closed';
  organizer: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    trustScore: number;
  };
  updates: Update[];
  signers: {
    name: string;
    date: string;
    badge?: string;
  }[];
  boosted?: boolean;
  boostLevel?: 'ndamel' | 'teranga' | 'lion' | null;
  viewedByAdmin?: boolean;
  rejectionFeedback?: string;
}

export interface Cagnotte {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  category: 'forage' | 'ecole' | 'mosquee' | 'ambulance' | 'eclairage' | 'sante' | 'autre';
  amountCollected: number; // in FCFA
  amountTarget: number; // in FCFA
  location: string;
  createdAt: string;
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'completed';
  organizer: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    trustScore: number;
  };
  isDiasporaTargeted: boolean;
  updates: Update[];
  expenses: Expense[];
  donors: {
    name: string;
    amount: number; // in FCFA
    date: string;
    comment?: string;
    isDiaspora: boolean;
  }[];
  documents?: string[];
  gallery?: string[];
  viewedByAdmin?: boolean;
  rejectionFeedback?: string;
}

export interface VolunteerMission {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  location: string;
  duration: string;
  needs: string;
  category: 'social' | 'environnement' | 'education' | 'sante';
  volunteersTarget: number;
  volunteersCount: number;
  organizer: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  status: 'active' | 'completed';
}

export interface VolunteerApplication {
  id: string;
  missionId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  message: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'Citoyen' | 'Ambassadeur' | 'Leader' | 'Bâtisseur' | 'Bienfaiteur';
  unlockedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ia';
  text: string;
  timestamp: string;
  suggestions?: string[];
  generationResult?: {
    title: string;
    description: string;
    petitionText?: string;
    facebookPost: string;
    whatsappMessage: string;
    flyerLayout: string; // inline CSS styles
  };
}

export interface AdminKPIs {
  totalUsers: number;
  totalDonations: number; // in FCFA
  totalSignatures: number;
  totalVolunteers: number;
  activeCampaigns: number;
  successRate: number;
  totalCommissions: number; // in FCFA (3% of totalDonations)
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  read: boolean;
}
