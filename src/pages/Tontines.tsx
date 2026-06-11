import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/Logo';
import { TrustScore } from '../components/TrustScore';

// ==========================================
// INTERFACES ET TYPES POUR LE MODULE TONTINE
// ==========================================

interface TontineMember {
  name: string;
  avatar: string;
  email: string;
  phone: string;
  verified: boolean;
  reputation: 'excellent' | 'fiable' | 'nouveau' | 'surveillance' | 'sanctionne';
  rate: number; // Taux de paiement (ex : 98)
  hasPaidThisRound: boolean;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  payer: string;
  beneficiary: string;
  status: 'paid' | 'pending' | 'late';
  transactionId: string;
  method: string;
  timestamp: string;
  ipAddress: string;
  proofHash: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'creation' | 'adhesion' | 'paiement' | 'retrait' | 'sanction' | 'vote';
  user: string;
  details: string;
}

interface VoteRequest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected';
  votesYes: string[];
  votesNo: string[];
  membersTotal: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface Tontine {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
  participantsMax: number;
  joinedCount: number;
  cotisation: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  orderType: 'random' | 'defined' | 'bid' | 'vote';
  status: 'recruiting' | 'active' | 'completed';
  organizer: {
    name: string;
    email: string;
    avatar: string;
    verified: boolean;
  };
  members: TontineMember[];
  payments: PaymentRecord[];
  activityLogs: ActivityLog[];
  votes: VoteRequest[];
  chat: ChatMessage[];
  guaranteeFundActive: boolean;
  guaranteeFundAmount: number; // Caution par membre
  guaranteeFundTotal: number; // Pool collecté
}

interface TontinesProps {
  onNavigate: (page: string, params?: any) => void;
  initialTontineId?: string;
}

export const Tontines: React.FC<TontinesProps> = ({ onNavigate, initialTontineId }) => {
  const { currentUser, addNotification, sendOtpSms, verifyOtp, isProfileComplete, setSelectedPublicUserId, usersList } = useApp();

  // ----------------------------------------------------
  // ÉTATS DES ONGLETS DE LA PAGE ET SÉLECTION DE TONTINE
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'discover' | 'my-tontines' | 'create' | 'admin'>('discover');
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(null);
  const [tontineDashboardTab, setTontineDashboardTab] = useState<'general' | 'calendar' | 'ledger' | 'contract' | 'votes' | 'chat'>('general');
  const [createdPrivateTontineLink, setCreatedPrivateTontineLink] = useState<string | null>(null);

  // -------------------------
  // MOCK DE TONTINES PAR DÉFAUT
  // -------------------------
  const [tontines, setTontines] = useState<Tontine[]>(() => {
    const saved = localStorage.getItem('sc_tontines_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return [];
  });

  // Sauvegarde locale
  useEffect(() => {
    localStorage.setItem('sc_tontines_list', JSON.stringify(tontines));
  }, [tontines]);

  // Handle shared link direct load (especially for private tontines)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tontineDataParam = params.get('tontineData');
    const tontineIdParam = params.get('tontine');
    
    if (tontineDataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(tontineDataParam))));
        const existing = tontines.find(t => t.id === decoded.id);
        if (!existing) {
          let calculatedEndDate = '';
          try {
            const startMs = decoded.startDate ? new Date(decoded.startDate).getTime() : Date.now();
            calculatedEndDate = new Date(startMs + (decoded.participantsMax * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } catch {
            calculatedEndDate = new Date(Date.now() + (decoded.participantsMax * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          }
          const newTontine: Tontine = {
            id: decoded.id,
            name: decoded.name,
            description: decoded.description,
            type: 'private',
            participantsMax: decoded.participantsMax,
            joinedCount: 1,
            cotisation: decoded.cotisation,
            frequency: decoded.frequency,
            startDate: decoded.startDate,
            endDate: calculatedEndDate,
            orderType: 'random',
            status: 'recruiting',
            organizer: {
              name: decoded.organizerName,
              email: '',
              avatar: '',
              verified: true
            },
            members: [
              {
                name: decoded.organizerName,
                avatar: '',
                email: '',
                phone: '',
                verified: true,
                reputation: 'excellent',
                rate: 100,
                hasPaidThisRound: false
              }
            ],
            payments: [],
            activityLogs: [
              { id: `log_init_${Date.now()}`, timestamp: new Date().toISOString(), type: 'creation', user: decoded.organizerName, details: `Tontine privée "${decoded.name}" importée via lien d'invitation.` }
            ],
            votes: [],
            chat: [],
            guaranteeFundActive: false,
            guaranteeFundAmount: 0,
            guaranteeFundTotal: 0
          };
          setTontines(prev => [newTontine, ...prev]);
        }
        setSelectedTontineId(decoded.id);
        setActiveTab('my-tontines');
      } catch (err) {
        console.error("Error decoding tontine shared link", err);
      }
    } else if (tontineIdParam) {
      setSelectedTontineId(tontineIdParam);
      const targetTontine = tontines.find(t => t.id === tontineIdParam);
      if (targetTontine) {
        setActiveTab('my-tontines');
      }
    }
  }, [initialTontineId, tontines]);

  // -------------------------
  // FORMULAIRE DE CRÉATION
  // -------------------------
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [participantsMax, setParticipantsMax] = useState(10);
  const [cotisation, setCotisation] = useState(10000);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [startDate, setStartDate] = useState('2026-06-15');
  const [orderType, setOrderType] = useState<'random' | 'defined' | 'bid' | 'vote'>('random');
  const [guaranteeFundActive, setGuaranteeFundActive] = useState(false);
  const [guaranteeFundAmount, setGuaranteeFundAmount] = useState(5000);

  // ------------------------------------
  // PROCESSUS D'ADHÉSION & VÉRIFICATION
  // ------------------------------------
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifStep, setVerifStep] = useState<'request' | 'otp' | 'photo' | 'success'>('request');
  const [verifPhone, setVerifPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verifAvatar, setVerifAvatar] = useState('');
  const [joiningTontineId, setJoiningTontineId] = useState<string | null>(null);

  // ---------------------------------------
  // SIGNATURE ÉLECTRONIQUE ET SOUMISSION
  // ---------------------------------------
  const [showContractModal, setShowContractModal] = useState(false);
  const [signName, setSignName] = useState('');
  const [agreePay, setAgreePay] = useState(false);
  const [agreeSanctions, setAgreeSanctions] = useState(false);
  const [agreeRules, setAgreeRules] = useState(false);

  // ------------------------------------
  // CONSEILLER IA ET SURVEILLANCE ADMIN
  // ------------------------------------
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [adminLitigations, setAdminLitigations] = useState<any[]>([]);

  // -------------------------
  // SIMULATION DE TIRAGE ANIME
  // -------------------------
  const [isDrawing, setIsDrawing] = useState(false);
  const [spinWinnerName, setSpinWinnerName] = useState('');
  const [celebrateWinner, setCelebrateWinner] = useState<string | null>(null);

  // ------------------------------
  // MESSAGERIE INTERNE ET CHAT
  // ------------------------------
  const [chatInput, setChatInput] = useState('');

  // ---------------------------------------------
  // SIMULATEUR DE PAIEMENT MOBILE MONEY (WAVE...)
  // ---------------------------------------------
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTontine, setPaymentTontine] = useState<Tontine | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wave' | 'om' | 'free' | 'card'>('wave');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // -----------------------
  // VOTE COMMUNAUTAIRE
  // -----------------------
  const [newVoteTitle, setNewVoteTitle] = useState('');
  const [newVoteDesc, setNewVoteDesc] = useState('');
  const [showNewVoteForm, setShowNewVoteForm] = useState(false);

  // -----------------------------------------
  // CALCUL DES KPIS GLOBAUX POUR LA FINTECH
  // -----------------------------------------
  const totalCotisationsVolume = tontines.reduce((acc, t) => {
    const paidCount = t.payments.filter(p => p.status === 'paid').length;
    return acc + (paidCount * t.cotisation);
  }, 0);

  const activeTontinesCount = tontines.filter(t => t.status === 'active').length;
  
  // Taux de paiement moyen basé sur les membres
  const totalPaymentRate = Math.round(
    tontines.reduce((acc, t) => {
      const sum = t.members.reduce((sumM, m) => sumM + m.rate, 0);
      return acc + (t.members.length ? sum / t.members.length : 100);
    }, 0) / tontines.length
  );

  // -----------------------------------------
  // PAIEMENT ET COTISATION
  // -----------------------------------------
  const openPaymentSimulation = (tontine: Tontine) => {
    if (!currentUser) {
      addNotification("⚠️ Veuillez vous connecter pour effectuer un paiement.");
      onNavigate('auth');
      return;
    }
    setPaymentTontine(tontine);
    setPaymentPhone(currentUser.phone || '');
    setShowPaymentModal(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTontine) return;
    setIsPaying(true);
    
    // Simuler délai de traitement
    setTimeout(() => {
      const txId = 'TX_' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date();
      const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const mockIP = '197.35.' + Math.floor(10 + Math.random() * 200) + '.' + Math.floor(10 + Math.random() * 200);
      // Faux hash SHA-256
      const randomHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
      
      const newPay: PaymentRecord = {
        id: `pay_${Date.now()}`,
        date: now.toISOString().split('T')[0],
        amount: paymentTontine.cotisation,
        payer: currentUser?.name || 'Visiteur',
        beneficiary: paymentTontine.members[0]?.name || 'Organisateur',
        status: 'paid',
        transactionId: txId,
        method: selectedPaymentMethod.toUpperCase(),
        timestamp: timestampStr,
        ipAddress: mockIP,
        proofHash: randomHash
      };

      const newLog: ActivityLog = {
        id: `log_${Date.now()}`,
        timestamp: timestampStr,
        type: 'paiement',
        user: currentUser?.name || 'Visiteur',
        details: `Cotisation de ${paymentTontine.cotisation.toLocaleString('fr-FR')} F validée via ${newPay.method}. Réf: ${txId}`
      };

      setTontines(prev => prev.map(t => {
        if (t.id === paymentTontine.id) {
          // Marquer le membre courant comme ayant payé
            const updatedMembers = t.members.map(m => {
              if (m.name?.toLowerCase() === (currentUser?.name || '').toLowerCase()) {
                return { ...m, hasPaidThisRound: true, rate: Math.min(100, m.rate + 1) };
              }
              return m;
            });

          return {
            ...t,
            payments: [newPay, ...t.payments],
            activityLogs: [newLog, ...t.activityLogs],
            members: updatedMembers
          };
        }
        return t;
      }));

      setIsPaying(false);
      setShowPaymentModal(false);
      addNotification(`💰 Paiement de ${paymentTontine.cotisation.toLocaleString('fr-FR')} FCFA validé avec succès !`);
    }, 2000);
  };

  // -----------------------------------------
  // ADHÉSION : ÉTAPES SMS OTP + PHOTO PROFIL
  // -----------------------------------------
  const startJoinFlow = (tontineId: string) => {
    if (!currentUser) {
      addNotification("⚠️ Connectez-vous d'abord pour rejoindre une tontine.");
      onNavigate('auth');
      return;
    }

    if (!isProfileComplete(currentUser)) {
      addNotification("🔒 Profil d'identité incomplet. Vous devez certifier votre identité (KYC) pour rejoindre une tontine.");
      onNavigate('profile', { requireCompletion: true });
      return;
    }
    
    setJoiningTontineId(tontineId);
    setShowContractModal(true);
  };

  const handleSendVerificationOtp = () => {
    if (!verifPhone) {
      alert("Veuillez saisir un numéro de téléphone.");
      return;
    }
    sendOtpSms(verifPhone);
    setVerifStep('otp');
  };

  const handleVerifyOtpCode = () => {
    const success = verifyOtp(otpCode);
    if (success) {
      setVerifStep('photo');
    } else {
      alert("Code incorrect. Veuillez réessayer.");
    }
  };

  const handleUploadPhotoBase64 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setVerifAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalizeVerification = () => {
    if (!verifAvatar && !currentUser?.avatar) {
      alert("Veuillez charger une photo de profil.");
      return;
    }
    
    // Mettre à jour l'utilisateur courant comme vérifié
    addNotification("✅ Téléphone et profil validés ! Compte certifié.");
    setVerifStep('success');
  };

  const proceedToContract = () => {
    setShowVerificationModal(false);
    setShowContractModal(true);
  };

  const handleSignContractAndJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreePay || !agreeSanctions || !agreeRules) {
      alert("Vous devez accepter toutes les conditions du contrat d'engagement.");
      return;
    }
    if (!signName || signName.toLowerCase() !== (currentUser?.name || '').toLowerCase()) {
      alert("La signature électronique doit correspondre exactement à votre Nom complet.");
      return;
    }

    if (!joiningTontineId) return;

    const selectedTontine = tontines.find(t => t.id === joiningTontineId);
    if (!selectedTontine) return;

    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const mockIP = '197.35.45.99'; // IP de simulation

    const newMember: TontineMember = {
      name: currentUser?.name || 'Visiteur',
      avatar: currentUser?.avatar || verifAvatar || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || verifPhone || '',
      verified: true,
      reputation: 'nouveau',
      rate: 90,
      hasPaidThisRound: false
    };

    const newLog: ActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: timestampStr,
      type: 'adhesion',
      user: newMember.name,
      details: `${newMember.name} a signé le contrat d'engagement numérique (IP : ${mockIP}) et a intégré la tontine.`
    };

    setTontines(prev => prev.map(t => {
      if (t.id === joiningTontineId) {
        return {
          ...t,
          joinedCount: t.joinedCount + 1,
          members: [...t.members, newMember],
          activityLogs: [newLog, ...t.activityLogs]
        };
      }
      return t;
    }));

    setShowContractModal(false);
    setSignName('');
    setAgreePay(false);
    setAgreeSanctions(false);
    setAgreeRules(false);
    
    addNotification(`🎉 Félicitations ! Vous avez rejoint la tontine "${selectedTontine.name}".`);
    setSelectedTontineId(joiningTontineId);
    setActiveTab('my-tontines');
    setTontineDashboardTab('general');
  };

  // -----------------------------------------
  // CRÉATION D'UNE NOUVELLE TONTINE
  // -----------------------------------------
  const handleCreateNewTontine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      addNotification("⚠️ Connectez-vous pour créer une tontine.");
      onNavigate('auth');
      return;
    }
    if (!isProfileComplete(currentUser)) {
      addNotification("🔒 Profil d'identité incomplet. Vous devez certifier votre identité (KYC) pour créer une tontine.");
      onNavigate('profile', { requireCompletion: true });
      return;
    }
    if (!name || !description) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const creatorMember: TontineMember = {
      name: currentUser.name,
      avatar: currentUser.avatar || '',
      email: currentUser.email,
      phone: currentUser.phone || '',
      verified: true,
      reputation: 'excellent',
      rate: 100,
      hasPaidThisRound: false
    };

    let calculatedEndDate = '';
    try {
      const parsedStart = startDate ? new Date(startDate) : new Date();
      const startMs = isNaN(parsedStart.getTime()) ? Date.now() : parsedStart.getTime();
      calculatedEndDate = new Date(startMs + (participantsMax * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    } catch {
      calculatedEndDate = new Date(Date.now() + (participantsMax * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    }

    const newTontine: Tontine = {
      id: `ton_${Date.now()}`,
      name,
      description,
      type,
      participantsMax,
      joinedCount: 1,
      cotisation,
      frequency,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: calculatedEndDate,
      orderType,
      status: 'recruiting',
      organizer: {
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar || '',
        verified: true
      },
      members: [creatorMember],
      payments: [],
      activityLogs: [
        { id: `log_init_${Date.now()}`, timestamp: timestampStr, type: 'creation', user: currentUser.name, details: `Création de la tontine "${name}" avec un objectif de ${participantsMax} membres.` }
      ],
      votes: [],
      chat: [
        { id: `chat_init_${Date.now()}`, sender: 'System', text: `Tontine "${name}" créée avec succès. En attente de membres.`, timestamp: now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) }
      ],
      guaranteeFundActive,
      guaranteeFundAmount: guaranteeFundActive ? guaranteeFundAmount : 0,
      guaranteeFundTotal: guaranteeFundActive ? guaranteeFundAmount : 0
    };

    setTontines(prev => [newTontine, ...prev]);
    
    if (type === 'private') {
      const tontineDataObj = {
        id: newTontine.id,
        name: newTontine.name,
        description: newTontine.description,
        cotisation: newTontine.cotisation,
        frequency: newTontine.frequency,
        participantsMax: newTontine.participantsMax,
        startDate: newTontine.startDate,
        organizerName: newTontine.organizer.name
      };
      const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(tontineDataObj))));
      const shareLink = `${window.location.origin}${window.location.pathname}?tontineData=${encodedData}`;
      setCreatedPrivateTontineLink(shareLink);
      addNotification(`🔒 Tontine privée "${name}" créée avec succès !`);
    } else {
      addNotification(`🔄 Tontine "${name}" publiée dans la section publique !`);
    }
    
    // Reset form
    setName('');
    setDescription('');
    setType('public');
    setParticipantsMax(10);
    setCotisation(10000);
    setFrequency('weekly');
    setStartDate('2026-06-15');
    setOrderType('random');
    setGuaranteeFundActive(false);
    
    setSelectedTontineId(newTontine.id);
    setActiveTab('my-tontines');
    setTontineDashboardTab('general');
  };

  // -----------------------------------------
  // SIMULATION DE TIRAGE ROTATIF ANIME (ROULETTE)
  // -----------------------------------------
  const executeDrawSimulation = (tontine: Tontine) => {
    if (isDrawing) return;
    setIsDrawing(true);
    setCelebrateWinner(null);

    // Faire défiler les noms
    let idx = 0;
    const interval = setInterval(() => {
      const randomMember = tontine.members[Math.floor(Math.random() * tontine.members.length)];
      setSpinWinnerName(randomMember.name);
    }, 70);

    setTimeout(() => {
      clearInterval(interval);
      
      // Choisir un gagnant qui n'a pas encore gagné
      const alreadyWon = tontine.payments.map(p => p.beneficiary);
      const remainingMembers = tontine.members.filter(m => !alreadyWon.includes(m.name));
      const pool = remainingMembers.length > 0 ? remainingMembers : tontine.members;
      const finalWinner = pool[Math.floor(Math.random() * pool.length)].name;

      setSpinWinnerName(finalWinner);
      setIsDrawing(false);
      setCelebrateWinner(finalWinner);

      // Ajouter le log d'activité
      const now = new Date();
      const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      const roundNum = tontine.payments.length + 1;
      const potTotal = tontine.joinedCount * tontine.cotisation;

      const newLog: ActivityLog = {
        id: `log_${Date.now()}`,
        timestamp: timestampStr,
        type: 'retrait',
        user: finalWinner,
        details: `Ronde ${roundNum} gagnée par ${finalWinner}. Pot cumulé de ${potTotal.toLocaleString('fr-FR')} F versé.`
      };

      setTontines(prev => prev.map(t => {
        if (t.id === tontine.id) {
          // Remettre à faux les paiements de la ronde pour tous les membres pour la prochaine ronde
          const resetPaidMembers = t.members.map(m => ({ ...m, hasPaidThisRound: false }));
          return {
            ...t,
            activityLogs: [newLog, ...t.activityLogs],
            members: resetPaidMembers
          };
        }
        return t;
      }));

      addNotification(`🏆 Tirage : ${finalWinner} gagne le pot de ${potTotal.toLocaleString('fr-FR')} F !`);
    }, 2800);
  };

  // -----------------------------------------
  // CONSEILLER IA : DÉTECTION DES RISQUES
  // -----------------------------------------
  const runAiRiskAnalysis = (tontine: Tontine) => {
    // Analyse factice basée sur le taux de paiement historique des membres
    const averageRate = tontine.members.reduce((acc, m) => acc + m.rate, 0) / tontine.members.length;
    const size = tontine.members.length;
    const amount = tontine.cotisation;
    
    let riskScore = 'Faible';
    let riskPercentage = 3;
    let badgeColor = 'var(--success)';
    
    if (averageRate < 93) {
      riskScore = 'Élevé';
      riskPercentage = 27;
      badgeColor = 'var(--danger)';
    } else if (averageRate < 97) {
      riskScore = 'Modéré';
      riskPercentage = 12;
      badgeColor = 'var(--warning)';
    }

    // Conseils personnalisés
    const recommendation = riskScore === 'Élevé' 
      ? "🚨 Attention : Deux membres ont un score de confiance inférieur à 90. Il est recommandé de suspendre temporairement les tirages de ces membres ou d'exiger une caution de fonds de garantie doublée."
      : riskScore === 'Modéré'
      ? "⚠️ Conseil : La tontine présente un risque modéré. Assurez-vous d'envoyer les notifications de rappel 48h à l'avance pour éviter les retards constatés lors des échéances précédentes."
      : "🟢 Excellente Tontine : Tous les membres affichent un historique exemplaire. Le risque de défaut de paiement est quasi nul. La ronde peut se poursuivre sereinement.";

    setAiAnalysisResult({
      riskScore,
      riskPercentage,
      badgeColor,
      recommendation,
      averageRate: Math.round(averageRate),
      runAt: new Date().toLocaleTimeString('fr-FR')
    });
    
    addNotification("🤖 Analyse de risque IA complétée avec succès !");
  };

  // -----------------------------------------
  // ENVOI DE MESSAGE DE CHAT
  // -----------------------------------------
  const handleSendChatMessage = (e: React.FormEvent, tontine: Tontine) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentUser) return;

    const now = new Date();
    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: currentUser.name,
      text: chatInput,
      timestamp: now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
    };

    setTontines(prev => prev.map(t => {
      if (t.id === tontine.id) {
        return {
          ...t,
          chat: [...t.chat, newMsg]
        };
      }
      return t;
    }));

    setChatInput('');
  };

  // -----------------------------------------
  // GESTION DU VOTE COMMUNAUTAIRE
  // -----------------------------------------
  const handleCreateVote = (e: React.FormEvent, tontine: Tontine) => {
    e.preventDefault();
    if (!newVoteTitle || !newVoteDesc || !currentUser) return;

    const newVote: VoteRequest = {
      id: `vote_${Date.now()}`,
      title: newVoteTitle,
      description: newVoteDesc,
      status: 'active',
      votesYes: [currentUser.name],
      votesNo: [],
      membersTotal: tontine.members.length
    };

    setTontines(prev => prev.map(t => {
      if (t.id === tontine.id) {
        return {
          ...t,
          votes: [newVote, ...t.votes],
          activityLogs: [
            { id: `log_vote_${Date.now()}`, timestamp: new Date().toISOString(), type: 'vote', user: currentUser.name, details: `Lancement d'un vote communautaire : "${newVoteTitle}"` },
            ...t.activityLogs
          ]
        };
      }
      return t;
    }));

    setNewVoteTitle('');
    setNewVoteDesc('');
    setShowNewVoteForm(false);
    addNotification("🗳️ Proposition de vote publiée !");
  };

  const handleCastVote = (tontine: Tontine, voteId: string, choice: 'yes' | 'no') => {
    if (!currentUser) return;

    setTontines(prev => prev.map(t => {
      if (t.id === tontine.id) {
        const updatedVotes = t.votes.map(v => {
          if (v.id === voteId) {
            // Retirer des deux listes pour éviter les doubles votes
            const cleanYes = v.votesYes.filter(u => u !== currentUser.name);
            const cleanNo = v.votesNo.filter(u => u !== currentUser.name);
            
            if (choice === 'yes') {
              cleanYes.push(currentUser.name);
            } else {
              cleanNo.push(currentUser.name);
            }

            // Calcul du statut du vote si majorité absolue atteinte
            let status = v.status;
            if (cleanYes.length > v.membersTotal / 2) {
              status = 'passed';
            } else if (cleanNo.length >= v.membersTotal / 2) {
              status = 'rejected';
            }

            return {
              ...v,
              votesYes: cleanYes,
              votesNo: cleanNo,
              status
            };
          }
          return v;
        });

        return {
          ...t,
          votes: updatedVotes
        };
      }
      return t;
    }));

    addNotification("🗳️ Vote enregistré avec succès !");
  };

  // -----------------------------------------
  // EXCLUSION / SANCTION ADMIN D'UN MEMBRE
  // -----------------------------------------
  const handleSanctionMember = (tontine: Tontine, memberName: string) => {
    const confirmSanction = window.confirm(`Voulez-vous vraiment sanctionner le membre ${memberName} pour retards répétés ? Son score de réputation sera dégradé.`);
    if (!confirmSanction) return;

    setTontines(prev => prev.map(t => {
      if (t.id === tontine.id) {
        const updatedMembers = t.members.map(m => {
          if (m.name === memberName) {
            return {
              ...m,
              reputation: 'sanctionne' as const,
              rate: Math.max(30, m.rate - 20)
            };
          }
          return m;
        });

        const newLog: ActivityLog = {
          id: `log_sanc_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'sanction',
          user: 'Admin Platform',
          details: `Sanction officielle appliquée à ${memberName}. Dégradation de son score de confiance.`
        };

        return {
          ...t,
          members: updatedMembers,
          activityLogs: [newLog, ...t.activityLogs]
        };
      }
      return t;
    }));

    addNotification(`⚠️ Le membre ${memberName} a été sanctionné officiellement.`);
  };

  // -----------------------------------------
  // RÉCUPÉRATION DU COMPTE TONTINE EXPLICIT
  // -----------------------------------------
  const currentTontine = tontines.find(t => t.id === selectedTontineId) || null;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      
      {/* 1. EN-TÊTE FINTECH PREMIUM */}
      <div 
        className="premium-card" 
        style={{ 
          background: 'linear-gradient(135deg, var(--dark) 0%, #064e3b 100%)', 
          color: 'white', 
          marginBottom: '2rem',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '3.5rem' }}>🔄</span>
          <div>
            <span style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
              Fintech Solidaire & Épargne Rotative
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.2rem 0' }}>Tontines Citoyennes & Diaspora</h1>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Épargnez en communauté en toute transparence. Contrats certifiés, traçabilité ledger et scoring réputation par IA.
            </p>
          </div>
        </div>

        {/* Global Statistics */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Épargne Cumulative</span>
            <strong style={{ fontSize: '1.4rem', color: 'var(--secondary)' }}>
              {totalCotisationsVolume.toLocaleString('fr-FR')} F
            </strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Tontines Actives</span>
            <strong style={{ fontSize: '1.4rem', color: 'white' }}>{activeTontinesCount}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>Taux de Paiement Moyen</span>
            <strong style={{ fontSize: '1.4rem', color: '#6ee7b7' }}>{totalPaymentRate}%</strong>
          </div>
        </div>
      </div>

      {/* 2. ONGLETS DE SÉLECTION PRINCIPALE */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          borderBottom: '1px solid var(--border-light)', 
          paddingBottom: '0.5rem', 
          marginBottom: '1.5rem',
          overflowX: 'auto'
        }}
      >
        <button 
          className={`btn ${activeTab === 'discover' && !selectedTontineId ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setSelectedTontineId(null); setActiveTab('discover'); }}
        >
          🔍 Découvrir des Tontines
        </button>
        <button 
          className={`btn ${activeTab === 'my-tontines' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => {
            setActiveTab('my-tontines');
            if (!selectedTontineId && tontines.length > 0) {
              setSelectedTontineId(tontines[0].id);
            }
          }}
        >
          💼 Mes Tontines & Dashboard
        </button>
        <button 
          className={`btn ${activeTab === 'create' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => {
            if (!currentUser) {
              addNotification("⚠️ Connectez-vous d'abord pour créer une tontine.");
              onNavigate('auth');
              return;
            }
            if (!isProfileComplete(currentUser)) {
              addNotification("🔒 Profil d'identité incomplet. Vous devez certifier votre identité (KYC) pour créer une tontine.");
              onNavigate('profile', { requireCompletion: true });
              return;
            }
            setSelectedTontineId(null);
            setActiveTab('create');
          }}
        >
          ➕ Créer une Tontine
        </button>
        {currentUser?.role === 'admin' && (
          <button 
            className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ color: 'var(--warning)', fontWeight: 'bold' }}
            onClick={() => { setSelectedTontineId(null); setActiveTab('admin'); }}
          >
            🛡️ Console Admin Tontine
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* ONGLET 1 : DÉCOUVRIR LES TONTINES (PUBLIQUES/RECRUTEMENT) */}
      {/* ==================================================== */}
      {activeTab === 'discover' && !selectedTontineId && (
        <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
          {tontines.filter(t => t.type !== 'private' && (t.type === 'public' || t.status === 'recruiting')).map((t) => {
            const isUserMember = t.members.some(m => m.name?.toLowerCase() === (currentUser?.name || '').toLowerCase());
            return (
              <div key={t.id} className="premium-card hover-glow" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span 
                      style={{ 
                        background: 'rgba(0,133,63,0.1)', 
                        color: 'var(--primary)', 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '20px', 
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      {t.status === 'recruiting' ? 'Inscriptions Ouvertes' : 'En cours'}
                    </span>
                    <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginTop: '0.4rem' }}>{t.name}</h3>
                  </div>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                    {t.cotisation.toLocaleString('fr-FR')} F
                  </strong>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', flex: 1 }}>
                  {t.description}
                </p>

                <div 
                  style={{ 
                    background: 'var(--light)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                  }}
                >
                  {(() => {
                    const orgMatch = usersList.find(u => u.name?.toLowerCase() === t.organizer?.name?.toLowerCase());
                    return (
                      <div 
                        style={{ cursor: orgMatch ? 'pointer' : 'default' }}
                        onClick={(e) => {
                          if (orgMatch) {
                            e.stopPropagation();
                            setSelectedPublicUserId(orgMatch.id);
                          }
                        }}
                        title={orgMatch ? "Voir le profil de l'organisateur" : undefined}
                      >
                        👑 Organisateur : <strong style={{ color: orgMatch ? 'var(--primary)' : 'inherit', textDecoration: orgMatch ? 'underline' : 'none' }}>{t.organizer.name}</strong> {t.organizer.verified && '✅'}
                      </div>
                    );
                  })()}
                  <div>📅 Début de tontine : <strong>{t.startDate}</strong></div>
                  <div>🔄 Fréquence : <strong>{t.frequency === 'weekly' ? 'Hebdomadaire' : t.frequency === 'monthly' ? 'Mensuelle' : 'Quotidienne'}</strong></div>
                  <div>👥 Membres : <strong>{t.joinedCount} / {t.participantsMax} inscrits</strong></div>
                  {t.guaranteeFundActive && (
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                      🛡️ Fonds de Garantie requis : {t.guaranteeFundAmount.toLocaleString('fr-FR')} FCFA
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {isUserMember ? (
                    <button 
                      className="btn btn-outline" 
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      onClick={() => { setSelectedTontineId(t.id); setActiveTab('my-tontines'); }}
                    >
                      Voir mon Dashboard ➔
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, fontSize: '0.8rem' }}
                      onClick={() => startJoinFlow(t.id)}
                    >
                      Rejoindre le cercle ➔
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* ONGLET 2 : MES TONTINES ET DASHBOARD DÉTAILLÉ */}
      {/* ==================================================== */}
      {activeTab === 'my-tontines' && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Left panel: list of my tontines */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem' }}>💼 Vos cercles d'épargne</h3>
            {tontines.filter(t => t.members.some(m => m.name?.toLowerCase() === (currentUser?.name || '').toLowerCase())).map((t) => {
              const isSelected = selectedTontineId === t.id;
              return (
                <div 
                  key={t.id}
                  className="premium-card hover-glow"
                  style={{ 
                    cursor: 'pointer', 
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--light)' : 'var(--light-card)',
                    padding: '1rem'
                  }}
                  onClick={() => setSelectedTontineId(t.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{t.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {t.cotisation.toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block', marginTop: '0.25rem' }}>
                    Rondes : {t.payments.length} effectuées | {t.joinedCount} membres
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right panel: unit dashboard for selected tontine */}
          <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {currentTontine ? (
              <div className="premium-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentTontine.name}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
                      Organisateur : {(() => {
                        const orgMatch = usersList.find(u => u.name.toLowerCase() === currentTontine.organizer.name.toLowerCase());
                        return (
                          <strong 
                            style={{ 
                              color: orgMatch ? 'var(--primary)' : 'inherit', 
                              textDecoration: orgMatch ? 'underline' : 'none',
                              cursor: orgMatch ? 'pointer' : 'default' 
                            }}
                            onClick={() => {
                              if (orgMatch) setSelectedPublicUserId(orgMatch.id);
                            }}
                            title={orgMatch ? "Voir le profil de l'organisateur" : undefined}
                          >
                            {currentTontine.organizer.name}
                          </strong>
                        );
                      })()} | Type : <strong>{currentTontine.type === 'public' ? 'Public' : 'Privé'}</strong>
                    </span>
                  </div>
                  {currentTontine.members.some(m => m.name?.toLowerCase() === (currentUser?.name || '').toLowerCase()) ? (
                    <button 
                      className="btn btn-primary animate-pulse" 
                      onClick={() => openPaymentSimulation(currentTontine)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      💳 Cotiser ({currentTontine.cotisation.toLocaleString('fr-FR')} FCFA)
                    </button>
                  ) : (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => startJoinFlow(currentTontine.id)}
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                    >
                      🤝 Rejoindre cette tontine ➔
                    </button>
                  )}
                </div>

                {/* Subtabs for selected Tontine Dashboard */}
                <div 
                  style={{ 
                    display: 'flex', 
                    gap: '0.4rem', 
                    borderBottom: '1px solid var(--border-light)', 
                    paddingBottom: '0.5rem', 
                    marginBottom: '1.5rem',
                    overflowX: 'auto',
                    fontSize: '0.8rem'
                  }}
                >
                  <button 
                    className={`btn ${tontineDashboardTab === 'general' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.35rem 0.6rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    onClick={() => setTontineDashboardTab('general')}
                  >
                    📊 Général
                  </button>
                  <button 
                    className={`btn ${tontineDashboardTab === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.35rem 0.6rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    onClick={() => setTontineDashboardTab('calendar')}
                  >
                    📅 Calendrier
                  </button>
                  <button 
                    className={`btn ${tontineDashboardTab === 'ledger' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.35rem 0.6rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    onClick={() => setTontineDashboardTab('ledger')}
                  >
                    📋 Ledger & Journal
                  </button>
                  <button 
                    className={`btn ${tontineDashboardTab === 'contract' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.35rem 0.6rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    onClick={() => setTontineDashboardTab('contract')}
                  >
                    📜 Contrat Signé
                  </button>
                  <button 
                    className={`btn ${tontineDashboardTab === 'votes' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.35rem 0.6rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    onClick={() => setTontineDashboardTab('votes')}
                  >
                    🗳️ Votes ({currentTontine.votes.length})
                  </button>
                  <button 
                    className={`btn ${tontineDashboardTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '0.35rem 0.6rem', minWidth: 'auto', fontSize: '0.8rem' }}
                    onClick={() => setTontineDashboardTab('chat')}
                  >
                    💬 Chat ({currentTontine.chat.length})
                  </button>
                </div>

                {/* --------------------------------- */}
                {/* SUBTAB : GENERAL & ROULETTE & IA  */}
                {/* --------------------------------- */}
                {tontineDashboardTab === 'general' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Ring members list with reputation badges */}
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>👥 Membres actifs et Score de Confiance :</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {currentTontine.members.map((member, i) => {
                          const memMatch = usersList.find(u => u.name.toLowerCase() === member.name.toLowerCase());
                          return (
                            <div 
                              key={i} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.4rem', 
                                background: 'var(--light)', 
                                padding: '0.35rem 0.6rem', 
                                borderRadius: '20px',
                                border: '1px solid var(--border-light)',
                                fontSize: '0.75rem',
                                cursor: memMatch ? 'pointer' : 'default'
                              }}
                              onClick={() => {
                                if (memMatch) setSelectedPublicUserId(memMatch.id);
                              }}
                              title={memMatch ? "Voir le profil de ce membre" : undefined}
                            >
                              <span style={{ textDecoration: memMatch ? 'underline' : 'none', color: memMatch ? 'var(--primary)' : 'inherit' }}>
                                👤 {member.name}
                              </span>
                              <span 
                                style={{ 
                                  fontSize: '0.65rem', 
                                  background: member.reputation === 'excellent' ? '#d1fae5' : member.reputation === 'fiable' ? '#dbeafe' : member.reputation === 'nouveau' ? '#fef3c7' : '#fee2e2',
                                  color: member.reputation === 'excellent' ? '#065f46' : member.reputation === 'fiable' ? '#1e40af' : member.reputation === 'nouveau' ? '#92400e' : '#991b1b',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '10px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {member.reputation === 'excellent' ? '🥇 Excellent' : member.reputation === 'fiable' ? '🥈 Fiable' : member.reputation === 'nouveau' ? '🥉 Nouveau' : '⚠️ Sanctionné'}
                              </span>
                              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>({member.rate}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progress indicators */}
                    <div className="grid-cols-3" style={{ gap: '0.75rem' }}>
                      <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block' }}>Prochaine échéance</span>
                        <strong style={{ fontSize: '0.95rem' }}>2026-06-15</strong>
                      </div>
                      <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block' }}>Cagnotte en jeu</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>
                          {(currentTontine.cotisation * currentTontine.joinedCount).toLocaleString('fr-FR')} FCFA
                        </strong>
                      </div>
                      <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block' }}>Fonds de garantie</span>
                        <strong style={{ fontSize: '0.95rem' }}>
                          {currentTontine.guaranteeFundActive ? `${currentTontine.guaranteeFundTotal.toLocaleString('fr-FR')} F` : 'Inactif'}
                        </strong>
                      </div>
                    </div>

                    {/* slot machine trigger */}
                    {currentTontine.status === 'active' && (
                      <div style={{ background: 'rgba(0,133,63,0.03)', border: '1px solid rgba(0,133,63,0.1)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>🎰 Tirage au sort de la ronde</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginBottom: '1rem' }}>
                          Lancez l'animation de tirage rotatif pour désigner de manière aléatoire et équitable le gagnant du pot de cotisation actuel.
                        </p>
                        <button 
                          className="btn btn-primary"
                          onClick={() => executeDrawSimulation(currentTontine)}
                          disabled={isDrawing}
                          style={{ width: '100%' }}
                        >
                          {isDrawing ? '🎰 Tirage en cours...' : '🎰 Lancer le tirage rotatif de la ronde'}
                        </button>
                      </div>
                    )}

                    {/* AI Advisor Box */}
                    <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', border: '1px solid #f59e0b', padding: '1rem', borderRadius: 'var(--radius-sm)', color: '#92400e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          🤖 Conseiller IA Risque Tontine
                        </strong>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderColor: '#f59e0b', color: '#92400e', borderRadius: '4px' }}
                          onClick={() => runAiRiskAnalysis(currentTontine)}
                        >
                          Relancer l'évaluation
                        </button>
                      </div>

                      {aiAnalysisResult ? (
                        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div>Niveau de risque évalué : <strong style={{ color: aiAnalysisResult.badgeColor }}>{aiAnalysisResult.riskScore}</strong> ({aiAnalysisResult.riskPercentage}% de défaut potentiel)</div>
                          <div>Moyenne réputation des membres : <strong>{aiAnalysisResult.averageRate}%</strong></div>
                          <p style={{ fontStyle: 'italic', marginTop: '0.25rem', lineHeight: 1.3 }}>
                            {aiAnalysisResult.recommendation}
                          </p>
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.75rem', margin: 0, fontStyle: 'italic' }}>
                          L'IA n'a pas encore évalué cette tontine. Cliquez sur "Relancer l'évaluation" pour analyser l'historique des membres.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* --------------------------------- */}
                {/* SUBTAB : CALENDAR / DEADLINES     */}
                {/* --------------------------------- */}
                {tontineDashboardTab === 'calendar' && (
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.75rem' }}>📅 Calendrier des échéances et bénéficiaires</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Array.from({ length: currentTontine.participantsMax }).map((_, idx) => {
                        const roundNum = idx + 1;
                        const isPast = roundNum <= currentTontine.payments.length;
                        const beneficiaryName = currentTontine.payments[idx]?.beneficiary || `À définir (Ronde ${roundNum})`;
                        const amountInPlay = currentTontine.joinedCount * currentTontine.cotisation;
                        
                        return (
                          <div 
                            key={idx}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '0.6rem 0.85rem', 
                              background: isPast ? 'rgba(0,133,63,0.03)' : 'var(--light)', 
                              border: isPast ? '1px solid rgba(0,133,63,0.1)' : '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div>
                              <strong style={{ color: isPast ? 'var(--primary)' : 'var(--text-secondary-light)' }}>Ronde {roundNum}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', marginLeft: '1rem' }}>
                                Échéance : Ronde mensuelle {roundNum}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 'bold' }}>👤 {beneficiaryName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>+{amountInPlay.toLocaleString('fr-FR')} F</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --------------------------------- */}
                {/* SUBTAB : LEDGER & ACTIVITY LOGS  */}
                {/* --------------------------------- */}
                {tontineDashboardTab === 'ledger' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* immutable payment ledger */}
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        📋 Registre Infalsifiable des Transactions (Ledger) :
                      </strong>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'var(--light)', borderBottom: '1px solid var(--border-light)' }}>
                              <th style={{ padding: '0.5rem' }}>Date/Heure</th>
                              <th style={{ padding: '0.5rem' }}>Payeur</th>
                              <th style={{ padding: '0.5rem' }}>Bénéficiaire</th>
                              <th style={{ padding: '0.5rem' }}>Montant</th>
                              <th style={{ padding: '0.5rem' }}>Méthode</th>
                              <th style={{ padding: '0.5rem' }}>Transaction ID</th>
                              <th style={{ padding: '0.5rem' }}>IP Address</th>
                              <th style={{ padding: '0.5rem' }}>Proof Hash (SHA-256)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentTontine.payments.length > 0 ? (
                              currentTontine.payments.map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                  <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{p.timestamp}</td>
                                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{p.payer}</td>
                                  <td style={{ padding: '0.5rem' }}>{p.beneficiary}</td>
                                  <td style={{ padding: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{p.amount.toLocaleString('fr-FR')} F</td>
                                  <td style={{ padding: '0.5rem' }}>{p.method}</td>
                                  <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{p.transactionId}</td>
                                  <td style={{ padding: '0.5rem' }}>{p.ipAddress}</td>
                                  <td style={{ padding: '0.5rem', fontFamily: 'monospace', opacity: 0.8 }} title={p.proofHash}>
                                    {p.proofHash.substring(0, 10)}...
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={8} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary-light)' }}>
                                  Aucun paiement validé dans ce registre.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Non-modifiable Activity Logs */}
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        📜 Journal d'Activité de Sécurité :
                      </strong>
                      <div 
                        style={{ 
                          maxHeight: '180px', 
                          overflowY: 'auto', 
                          background: 'var(--light)', 
                          padding: '0.75rem', 
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        {currentTontine.activityLogs.map((log) => (
                          <div key={log.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem', lineHeight: 1.3 }}>
                            <span style={{ color: 'var(--text-secondary-light)' }}>[{log.timestamp}]</span>{' '}
                            <span style={{ fontWeight: 'bold' }}>{log.user}</span> : {log.details}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* --------------------------------- */}
                {/* SUBTAB : SIGNED CONTRACT DETAILS  */}
                {/* --------------------------------- */}
                {tontineDashboardTab === 'contract' && (
                  <div style={{ background: 'var(--light)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    <h3 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                      📜 Contrat d'Engagement Solidaire Numérique
                    </h3>
                    <p style={{ marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                      Contrat signé électroniquement lors de l'intégration à la tontine.
                    </p>
                    <div style={{ background: 'white', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      Je soussigné, membre inscrit à la tontine **{currentTontine.name}**, m'engage solennellement à :
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                        <li>Verser ma cotisation de **{currentTontine.cotisation.toLocaleString('fr-FR')} FCFA** à chaque échéance définie selon le calendrier.</li>
                        <li>Accepter le système de réputation citoyenne et les pénalités graduées en cas de retard de paiement de plus de 24 heures.</li>
                        <li>Respecter les décisions de gouvernance communautaire décidées par les votes majoritaires des membres.</li>
                      </ul>
                    </div>
                    <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text-secondary-light)' }}>
                      <div>Signataire : <strong>{currentUser?.name}</strong></div>
                      <div>Adresse IP : <strong>197.35.45.99</strong></div>
                      <div>Certificat horodaté : <strong>SAMA_SECURE_HASH_327189B</strong></div>
                    </div>
                  </div>
                )}

                {/* --------------------------------- */}
                {/* SUBTAB : COMMUNITY VOTING SYSTEM  */}
                {/* --------------------------------- */}
                {tontineDashboardTab === 'votes' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.85rem' }}>🗳️ Propositions de vote actives</strong>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px' }}
                        onClick={() => setShowNewVoteForm(!showNewVoteForm)}
                      >
                        {showNewVoteForm ? 'Annuler' : '🗳️ Créer un vote'}
                      </button>
                    </div>

                    {showNewVoteForm && (
                      <form 
                        onSubmit={(e) => handleCreateVote(e, currentTontine)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        <input 
                          type="text" 
                          required
                          placeholder="Intitulé du vote (ex : Exclure Aminata Ndiaye)"
                          className="premium-card"
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', background: 'white' }}
                          value={newVoteTitle}
                          onChange={(e) => setNewVoteTitle(e.target.value)}
                        />
                        <textarea 
                          required
                          rows={2}
                          placeholder="Détails et justifications pour motiver le vote..."
                          className="premium-card"
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', background: 'white' }}
                          value={newVoteDesc}
                          onChange={(e) => setNewVoteDesc(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem', fontSize: '0.75rem' }}>
                          Publier la proposition de vote
                        </button>
                      </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {currentTontine.votes.length > 0 ? (
                        currentTontine.votes.map((v) => {
                          const hasVotedYes = v.votesYes.includes(currentUser?.name || '');
                          const hasVotedNo = v.votesNo.includes(currentUser?.name || '');
                          
                          return (
                            <div 
                              key={v.id}
                              style={{ 
                                padding: '0.75rem', 
                                background: 'var(--light)', 
                                border: '1px solid var(--border-light)', 
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                <strong style={{ fontSize: '0.8rem' }}>{v.title}</strong>
                                <span 
                                  style={{ 
                                    background: v.status === 'passed' ? '#d1fae5' : v.status === 'rejected' ? '#fee2e2' : '#dbeafe',
                                    color: v.status === 'passed' ? '#065f46' : v.status === 'rejected' ? '#991b1b' : '#1e40af',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    fontSize: '0.6rem'
                                  }}
                                >
                                  {v.status === 'passed' ? 'Adopté' : v.status === 'rejected' ? 'Rejeté' : 'En cours'}
                                </span>
                              </div>
                              <p style={{ color: 'var(--text-secondary-light)', marginBottom: '0.75rem' }}>{v.description}</p>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    className={`btn ${hasVotedYes ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', minWidth: 'auto', borderRadius: '4px' }}
                                    onClick={() => handleCastVote(currentTontine, v.id, 'yes')}
                                    disabled={v.status !== 'active'}
                                  >
                                    Oui ({v.votesYes.length})
                                  </button>
                                  <button 
                                    className={`btn ${hasVotedNo ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', minWidth: 'auto', borderRadius: '4px' }}
                                    onClick={() => handleCastVote(currentTontine, v.id, 'no')}
                                    disabled={v.status !== 'active'}
                                  >
                                    Non ({v.votesNo.length})
                                  </button>
                                </div>
                                <span style={{ color: 'var(--text-secondary-light)', fontSize: '0.65rem' }}>
                                  Participation : {v.votesYes.length + v.votesNo.length} / {v.membersTotal} membres
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', fontStyle: 'italic', margin: 0 }}>
                          Aucune proposition de vote en cours.
                        </p>
                      )}
                    </div>

                  </div>
                )}

                {/* --------------------------------- */}
                {/* SUBTAB : INTERNAL GROUP CHAT     */}
                {/* --------------------------------- */}
                {tontineDashboardTab === 'chat' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div 
                      style={{ 
                        height: '200px', 
                        overflowY: 'auto', 
                        background: 'var(--light)', 
                        padding: '0.75rem', 
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      {currentTontine.chat.length > 0 ? (
                        currentTontine.chat.map((msg) => {
                          const isMe = msg.sender.toLowerCase() === (currentUser?.name || '').toLowerCase();
                          return (
                            <div 
                              key={msg.id}
                              style={{ 
                                maxWidth: '80%', 
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                background: isMe ? 'var(--primary)' : 'white',
                                color: isMe ? 'white' : 'var(--text-primary-light)',
                                border: isMe ? 'none' : '1px solid var(--border-light)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                boxShadow: 'var(--shadow-sm)'
                              }}
                            >
                              <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 'bold', marginBottom: '0.15rem' }}>
                                {msg.sender}
                              </div>
                              <div>{msg.text}</div>
                              <div style={{ fontSize: '0.55rem', textAlign: 'right', opacity: 0.7, marginTop: '0.15rem' }}>
                                {msg.timestamp}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary-light)', padding: '2rem 0', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Bienvenue dans le salon de discussion sécurisé de la tontine ! Rédigez votre premier message ci-dessous.
                        </div>
                      )}
                    </div>

                    <form 
                      onSubmit={(e) => handleSendChatMessage(e, currentTontine)}
                      style={{ display: 'flex', gap: '0.5rem' }}
                    >
                      <input 
                        type="text" 
                        required
                        placeholder="Rédigez votre message..."
                        className="premium-card"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                        Envoyer
                      </button>
                    </form>
                  </div>
                )}

              </div>
            ) : (
              <div className="premium-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-light)', fontSize: '0.85rem' }}>
                Sélectionnez l'une de vos tontines actives dans la colonne de gauche pour afficher son tableau de bord de gestion.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ==================================================== */}
      {/* ONGLET 3 : CRÉATION D'UNE NOUVELLE TONTINE          */}
      {/* ==================================================== */}
      {activeTab === 'create' && (
        <div className="premium-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            🔄 Lancer une nouvelle Tontine
          </h2>
          <form onSubmit={handleCreateNewTontine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Nom de la Tontine *</label>
              <input 
                type="text" 
                required
                placeholder="Ex : Tontine Diaspora Louga Progrès"
                className="premium-card" 
                style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Description *</label>
              <textarea 
                required
                rows={3}
                placeholder="Décrivez l'objectif de la tontine, ses règles de gouvernance et l'utilisation solidaire éventuelle des fonds..."
                className="premium-card" 
                style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Type d'accès</label>
                <select 
                  className="premium-card"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary-light)' }}
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                >
                  <option value="public">Publique (Visible par tous)</option>
                  <option value="private">Privée (Sur invitation)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Participants Maximum *</label>
                <input 
                  type="number" 
                  required
                  min={2}
                  max={50}
                  className="premium-card" 
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                  value={participantsMax}
                  onChange={(e) => setParticipantsMax(parseInt(e.target.value, 10))}
                />
              </div>
            </div>

            <div className="grid-cols-3" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Cotisation (FCFA)</label>
                <select 
                  className="premium-card"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary-light)' }}
                  value={cotisation}
                  onChange={(e) => setCotisation(parseInt(e.target.value, 10))}
                >
                  <option value={5000}>5 000 F</option>
                  <option value={10000}>10 000 F</option>
                  <option value={20000}>20 000 F</option>
                  <option value={50000}>50 000 F</option>
                  <option value={100000}>100 000 F</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Fréquence</label>
                <select 
                  className="premium-card"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary-light)' }}
                  value={frequency}
                  onChange={(e: any) => setFrequency(e.target.value)}
                >
                  <option value="daily">Quotidienne</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuelle</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Ordre de réception</label>
                <select 
                  className="premium-card"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary-light)' }}
                  value={orderType}
                  onChange={(e: any) => setOrderType(e.target.value)}
                >
                  <option value="random">Tirage aléatoire</option>
                  <option value="defined">Ordre défini à l'avance</option>
                  <option value="bid">Système d'enchères</option>
                  <option value="vote">Vote des membres</option>
                </select>
              </div>
            </div>

            <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Date de Début *</label>
                <input 
                  type="date"
                  required
                  className="premium-card"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Fonds de Garantie</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}>
                  <input 
                    type="checkbox" 
                    id="guaranteeActive"
                    checked={guaranteeFundActive}
                    onChange={(e) => setGuaranteeFundActive(e.target.checked)}
                  />
                  <label htmlFor="guaranteeActive" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>Activer la caution d'impayé</label>
                </div>
              </div>
            </div>

            {guaranteeFundActive && (
              <div className="animate-slide-up">
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Montant de la caution fixe par membre (FCFA)</label>
                <input 
                  type="number"
                  required
                  className="premium-card"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                  value={guaranteeFundAmount}
                  onChange={(e) => setGuaranteeFundAmount(parseInt(e.target.value, 10))}
                />
              </div>
            )}

            <div style={{ background: 'rgba(0,133,63,0.05)', border: '1px dashed var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary-light)', lineHeight: 1.4 }}>
              📌 En créant cette tontine, vous êtes automatiquement désigné comme l'organisateur. Vous devez valider les demandes d'admissions des membres et êtes responsable d'initier les rondes de tirage.
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              Publier et Activer la Tontine ➔
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* ONGLET 4 : CONSOLE ADMIN GLOBAL (MONITORING & LITIGES) */}
      {/* ==================================================== */}
      {activeTab === 'admin' && currentUser?.role === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>🛡️ Surveillance et Litiges des Tontines</h2>
          
          {/* Litigations listing */}
          <div className="premium-card" style={{ background: 'var(--light)' }}>
            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.75rem' }}>⚠️ Litiges en attente de traitement :</strong>
            {adminLitigations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {adminLitigations.map((lit) => (
                  <div 
                    key={lit.id}
                    style={{ 
                      background: 'white', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.85rem', display: 'block' }}>{lit.tontine}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                        Membre défaillant : <strong>{lit.user}</strong>
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', fontWeight: 600 }}>
                        {lit.reason}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', minWidth: 'auto', background: 'var(--danger)', border: 'none' }}
                        onClick={() => {
                          const activeT = tontines.find(t => t.name === lit.tontine);
                          if (activeT) {
                            handleSanctionMember(activeT, lit.user);
                            setAdminLitigations([]); // vider pour simulation
                          }
                        }}
                      >
                        Sanctionner / Bannir
                      </button>
                      <button 
                        className="btn btn-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', minWidth: 'auto' }}
                        onClick={() => {
                          setAdminLitigations([]);
                          addNotification("Litige classé sans suite.");
                        }}
                      >
                        Ignorer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary-light)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Aucun litige ou signalement de défaut de paiement à signaler pour le moment.
              </div>
            )}
          </div>

          {/* Platform stats */}
          <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
            <div className="premium-card">
              <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.75rem' }}>📊 Audit et Sécurité Plateforme :</strong>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>Taux d'engagement signé : <strong>100%</strong></div>
                <div>Tentatives de double compte bloquées : <strong>14</strong></div>
                <div>Alertes de défaut de paiement résolues : <strong>98%</strong></div>
                <div>Somme sous garantie globale : <strong>{tontines.reduce((acc, t) => acc + t.guaranteeFundTotal, 0).toLocaleString('fr-FR')} FCFA</strong></div>
              </div>
            </div>
            
            <div className="premium-card" style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.05) 0%, rgba(16,185,129,0.05) 100%)' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.75rem' }}>🔒 Journal d'audit de sécurité globale :</strong>
              <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '100px', overflowY: 'auto' }}>
                <div>[03:22:10 UTC] BLOCKED: Tentative de modification IP signature de Fatou Diop.</div>
                <div>[02:15:45 UTC] AUDIT: Vérification OTP SMS réussie pour l'utilisateur (+221 77 567 89 01).</div>
                <div>[01:00:12 UTC] LEDGER: Validation cryptographique de la transaction TX_990182. OK.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1 : VÉRIFICATION SMS OTP + PHOTO DE PROFIL    */}
      {/* ==================================================== */}
      {showVerificationModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="glass animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '0.95rem' }}>🔒 Certification de Profil Citoyen</strong>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => setShowVerificationModal(false)}>✕</button>
            </div>

            {verifStep === 'request' && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginBottom: '1rem' }}>
                  Afin de sécuriser les cercles d'épargne et d'éviter les fraudes, vous devez certifier votre compte par SMS OTP avant de rejoindre une tontine.
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Numéro de téléphone mobile</label>
                  <input 
                    type="text"
                    required
                    placeholder="+221 77 123 45 67"
                    className="premium-card"
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                    value={verifPhone}
                    onChange={(e) => setVerifPhone(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSendVerificationOtp}>
                  Envoyer le code OTP par SMS ➔
                </button>
              </div>
            )}

            {verifStep === 'otp' && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginBottom: '1rem' }}>
                  Saisissez le code OTP à 4 chiffres reçu dans le terminal SMS ci-dessus :
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Code de validation OTP</label>
                  <input 
                    type="text"
                    required
                    placeholder="1234"
                    className="premium-card"
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--light)', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '8px' }}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleVerifyOtpCode}>
                  Vérifier le code ➔
                </button>
              </div>
            )}

            {verifStep === 'photo' && (
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginBottom: '1rem' }}>
                  Une photo de profil claire est obligatoire pour participer aux tontines. Veuillez importer un portrait ou selfie :
                </p>
                <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                  <div 
                    style={{ 
                      width: '90px', 
                      height: '90px', 
                      borderRadius: '50%', 
                      background: 'var(--light)', 
                      border: '2px solid var(--border-light)',
                      backgroundImage: verifAvatar ? `url(${verifAvatar})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem',
                      fontSize: '2rem'
                    }}
                  >
                    {!verifAvatar && '📷'}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="verifAvatarInput"
                    onChange={handleUploadPhotoBase64}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="verifAvatarInput" className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
                    Choisir ma photo
                  </label>
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleFinalizeVerification}>
                  Valider et Enregistrer ➔
                </button>
              </div>
            )}

            {verifStep === 'success' && (
              <div>
                <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
                <h3 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>Certification Réussie !</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
                  Votre profil est désormais certifié et conforme aux exigences de sécurité financière de Sunu Yité.
                </p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={proceedToContract}>
                  Passer au contrat d'engagement ➔
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2 : CONTRAT ET SIGNATURE ÉLECTRONIQUE           */}
      {/* ==================================================== */}
      {showContractModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="glass animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>📜 Contrat d'Engagement Solidaire</h3>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => setShowContractModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSignContractAndJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
              
              {/* text of contract */}
              <div 
                style={{ 
                  maxHeight: '130px', 
                  overflowY: 'auto', 
                  background: 'white', 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-light)',
                  fontSize: '0.7rem',
                  lineHeight: 1.45,
                  color: '#444'
                }}
              >
                <strong>CONTRAT D'ADHÉSION AUX REGLES DE LA TONTINE CITOYENNE :</strong>
                <p style={{ marginTop: '0.25rem' }}>
                  Le présent contrat lie le signataire à la communauté du cercle d'épargne. En apposant sa signature numérique, l'adhérent s'engage à cotiser à chaque échéance la somme fixée par l'organisateur.
                </p>
                <p style={{ marginTop: '0.25rem' }}>
                  <strong>SANCTIONS GRADUÉES :</strong> Tout retard de paiement de plus de 24h entraîne une alerte automatique. Au-delà de 72h, un avertissement formel est émis. En cas de retard prolongé injustifié, la plateforme appliquera des pénalités financières et dégradera le score de confiance. Une exclusion totale et des poursuites de recouvrement pourront être menées en accord avec les statuts.
                </p>
              </div>

              {/* Checkboxes obligations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.25rem 0' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <input 
                    type="checkbox" 
                    id="chk1" 
                    required
                    checked={agreePay} 
                    onChange={(e) => setAgreePay(e.target.checked)} 
                    style={{ marginTop: '3px' }}
                  />
                  <label htmlFor="chk1" style={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    ☑️ Je m'engage à payer toutes mes cotisations à bonne date.
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <input 
                    type="checkbox" 
                    id="chk2" 
                    required
                    checked={agreeSanctions} 
                    onChange={(e) => setAgreeSanctions(e.target.checked)} 
                    style={{ marginTop: '3px' }}
                  />
                  <label htmlFor="chk2" style={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    ☑️ Je comprends et accepte les sanctions en cas de non-respect.
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <input 
                    type="checkbox" 
                    id="chk3" 
                    required
                    checked={agreeRules} 
                    onChange={(e) => setAgreeRules(e.target.checked)} 
                    style={{ marginTop: '3px' }}
                  />
                  <label htmlFor="chk3" style={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    ☑️ J'accepte les règles et la gouvernance par vote majoritaire.
                  </label>
                </div>
              </div>

              {/* Digital signature inputs */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  Signature électronique (Saisissez votre Nom complet) *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex : Fatou Diop"
                  className="premium-card" 
                  style={{ width: '100%', padding: '0.55rem', background: 'var(--light)', fontStyle: 'italic', fontFamily: 'serif', fontSize: '1.05rem', color: 'var(--text-primary-light)' }}
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', background: 'var(--light)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                ℹ️ <strong>Horodatage et preuve légale :</strong> Votre adresse IP (197.35.45.99) et la date du jour seront scellées dans ce contrat de manière infalsifiable pour servir de preuve.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowContractModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Signer et Rejoindre ➔
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3 : CELEBRATION DU GAGNE DU TIRAGE ROTATIF      */}
      {/* ==================================================== */}
      {celebrateWinner && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="glass animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 1.5rem',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              border: '2px solid var(--secondary)'
            }}
          >
            <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
            <h3 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>Félicitations !</h3>
            
            <div style={{ margin: '1.5rem 0' }}>
              <div 
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  margin: '0 auto 1rem' 
                }}
              >
                {celebrateWinner.substring(0, 2).toUpperCase()}
              </div>
              <strong style={{ fontSize: '1.3rem', display: 'block', color: 'var(--text-primary-light)' }}>{celebrateWinner}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
                Remporte la ronde de tirage rotative
              </span>
            </div>

            <div style={{ background: 'rgba(0,133,63,0.05)', border: '1px solid var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Gain du Pot de Cotisation : <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                {currentTontine ? (currentTontine.cotisation * currentTontine.joinedCount).toLocaleString('fr-FR') : '0'} FCFA
              </strong>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.65rem' }} 
              onClick={() => setCelebrateWinner(null)}
            >
              Fermer & Continuer ➔
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4 : PAIEMENT MOBILE MONEY SIMULE               */}
      {/* ==================================================== */}
      {showPaymentModal && paymentTontine && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="glass animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.95rem' }}>💳 S'acquitter d'une Cotisation</strong>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>

            <form onSubmit={handleExecutePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              
              <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                <div>Tontine : <strong>{paymentTontine.name}</strong></div>
                <div style={{ marginTop: '0.25rem' }}>Montant de la cotisation : <strong style={{ color: 'var(--primary)' }}>{paymentTontine.cotisation.toLocaleString('fr-FR')} FCFA</strong></div>
              </div>

              {/* Payment Methods */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Moyen de Paiement Mobile</label>
                <div className="grid-cols-2" style={{ gap: '0.5rem' }}>
                  <button 
                    type="button"
                    className={`btn ${selectedPaymentMethod === 'wave' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.5rem', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto', background: selectedPaymentMethod === 'wave' ? '#1d4ed8' : 'white', border: selectedPaymentMethod === 'wave' ? 'none' : '1px solid var(--border-light)' }}
                    onClick={() => setSelectedPaymentMethod('wave')}
                  >
                    🌊 Wave
                  </button>
                  <button 
                    type="button"
                    className={`btn ${selectedPaymentMethod === 'om' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.5rem', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto', background: selectedPaymentMethod === 'om' ? '#ea580c' : 'white', border: selectedPaymentMethod === 'om' ? 'none' : '1px solid var(--border-light)' }}
                    onClick={() => setSelectedPaymentMethod('om')}
                  >
                    🍊 Orange Money
                  </button>
                  <button 
                    type="button"
                    className={`btn ${selectedPaymentMethod === 'free' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.5rem', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto', background: selectedPaymentMethod === 'free' ? '#dc2626' : 'white', border: selectedPaymentMethod === 'free' ? 'none' : '1px solid var(--border-light)' }}
                    onClick={() => setSelectedPaymentMethod('free')}
                  >
                    🔴 Free Money
                  </button>
                  <button 
                    type="button"
                    className={`btn ${selectedPaymentMethod === 'card' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.5rem', fontSize: '0.75rem', textTransform: 'none', minWidth: 'auto', border: selectedPaymentMethod === 'card' ? 'none' : '1px solid var(--border-light)' }}
                    onClick={() => setSelectedPaymentMethod('card')}
                  >
                    💳 Carte Bancaire
                  </button>
                </div>
              </div>

              {selectedPaymentMethod !== 'card' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    Numéro de téléphone mobile associé *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="+221 77 123 45 67"
                    className="premium-card" 
                    style={{ width: '100%', padding: '0.55rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.65rem' }}
                disabled={isPaying}
              >
                {isPaying ? 'Traitement du paiement en cours...' : `Payer ${paymentTontine.cotisation.toLocaleString('fr-FR')} F ➔`}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5 : CONFIRMATION ET LIEN DE TONTINE PRIVÉE      */}
      {/* ==================================================== */}
      {createdPrivateTontineLink && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="glass animate-fade-in" 
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔒</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--primary)' }}>
              Tontine Privée Créée !
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Cette tontine est privée. Elle n'apparaîtra pas dans la liste publique du site. Partagez ce lien d'invitation avec vos amis pour qu'ils puissent la rejoindre :
            </p>

            <div 
              style={{
                background: 'var(--light)',
                border: '1px solid var(--border-light)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                wordBreak: 'break-all',
                color: 'var(--text-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}
            >
              <span style={{ textAlign: 'left', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {createdPrivateTontineLink}
              </span>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', minWidth: 'auto' }}
                onClick={() => {
                  navigator.clipboard.writeText(createdPrivateTontineLink);
                  addNotification("📋 Lien copié dans le presse-papier !");
                }}
              >
                Copier
              </button>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.65rem' }} 
              onClick={() => setCreatedPrivateTontineLink(null)}
            >
              Fermer & Accéder au Dashboard ➔
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Tontines;
