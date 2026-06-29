import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Logo } from '../components/Logo';
import { TrustScore } from '../components/TrustScore';
import { useSEO } from '../hooks/useSEO';
import { uploadBase64ToStorage } from '../services/supabaseClient';
import { Tontine, TontineMember, PaymentRecord, ActivityLog, VoteRequest, TontineChatMessage } from '../types';
import { initializePayTechPayment } from '../services/paytech';

// Helper to compress base64 images client-side
const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface TontinesProps {
  onNavigate: (page: string, params?: any) => void;
  initialTontineId?: string;
}

export const Tontines: React.FC<TontinesProps> = ({ onNavigate, initialTontineId }) => {
  const { currentUser, addNotification, sendOtpSms, verifyOtp, isProfileComplete, setSelectedPublicUserId, usersList, tontines, saveTontine } = useApp();
  const { t } = useLanguage();

  // ----------------------------------------------------
  // ÉTATS DES ONGLETS DE LA PAGE ET SÉLECTION DE TONTINE
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'discover' | 'my-tontines' | 'create' | 'admin'>('discover');
  const [selectedTontineId, setSelectedTontineId] = useState<string | null>(null);
    const [tontineDashboardTab, setTontineDashboardTab] = useState<'general' | 'calendar' | 'ledger' | 'contract' | 'votes' | 'chat' | 'health'>('general');
    const [createdPrivateTontineLink, setCreatedPrivateTontineLink] = useState<string | null>(null);

    // Relance states
  const [reminderModalData, setReminderModalData] = useState<{
    tontine: Tontine;
    memberName: string;
    phone?: string;
  } | null>(null);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState<boolean>(false);
  const [sendViaSms, setSendViaSms] = useState<boolean>(false);
  const [customReminderPhone, setCustomReminderPhone] = useState<string>('');
  const [customReminderMsg, setCustomReminderMsg] = useState<string>('');

  useEffect(() => {
    if (reminderModalData) {
      setCustomReminderPhone(reminderModalData.phone || '');
      setSendViaWhatsApp(!!reminderModalData.phone);
      setSendViaSms(false);
      
      const tontine = reminderModalData.tontine;
      const mName = reminderModalData.memberName;
      const amountStr = tontine.cotisation.toLocaleString('fr-FR');
      const defaultMsg = t('tontine.relance_template')
        .replace('{name}', mName)
        .replace('{amount}', amountStr)
        .replace('{tontineName}', tontine.name);
      setCustomReminderMsg(defaultMsg);
    }
  }, [reminderModalData, t]);

  const setTontines = (updater: Tontine[] | ((prev: Tontine[]) => Tontine[])) => {
    const nextVal = typeof updater === 'function' ? updater(tontines) : updater;
    nextVal.forEach(t => {
      const current = tontines.find(prevT => prevT.id === t.id);
      if (!current || JSON.stringify(current) !== JSON.stringify(t)) {
        saveTontine(t);
      }
    });
  };


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
            guaranteeFundTotal: 0,
            accumulatedSavings: 0
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

  // KYC Blocker state
  const [showKycBlocker, setShowKycBlocker] = useState(false);
  // Cover image for creation
  const [coverImage, setCoverImage] = useState('');
  const [tontineType, setTontineType] = useState<'money' | 'product'>('money');
  const [productImages, setProductImages] = useState<string[]>([]);

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
  const totalPaymentRate = tontines.length > 0 ? Math.round(
    tontines.reduce((acc, t) => {
      const sum = t.members.reduce((sumM, m) => sumM + m.rate, 0);
      return acc + (t.members.length ? sum / t.members.length : 100);
    }, 0) / tontines.length
  ) : 100;

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
            members: updatedMembers,
            accumulatedSavings: (t.accumulatedSavings || 0) + paymentTontine.cotisation
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
            onNavigate('profile', { requireCompletion: true, target: 'kyc' });
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
      if (file.size > 1 * 1024 * 1024) {
        alert("L'image dépasse la limite maximale autorisée de 1 Mo. Veuillez choisir une image plus légère. 🇸🇳");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          compressImage(event.target.result as string).then(compressed => {
                        uploadBase64ToStorage(compressed, 'tontines').then(storageUrl => setVerifAvatar(storageUrl));
          });
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
            onNavigate('profile', { requireCompletion: true, target: 'kyc' });
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
      guaranteeFundTotal: guaranteeFundActive ? guaranteeFundAmount : 0,
      accumulatedSavings: 0,
      coverImage: coverImage,
      tontineType: tontineType,
      productImages: productImages
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
            const shareLink = `${window.location.origin}/cause?tontineData=${encodedData}`;
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
    setCoverImage('');
    setTontineType('money');
    setProductImages([]);
    
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
    const averageRate = tontine.members.length > 0 ? tontine.members.reduce((acc, m) => acc + m.rate, 0) / tontine.members.length : 100;
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
        const newMsg: TontineChatMessage = {
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
  // RAPPELS ET PÉNALITÉS PAR L'ORGANISATEUR
  // -----------------------------------------
    const handleSendPaymentReminder = (
    tontine: Tontine, 
    memberName: string, 
    channel: 'chat' | 'whatsapp' | 'sms' = 'chat',
    customPhone?: string,
    customMsg?: string
  ) => {
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    let msgText = '';
    let logDetails = '';

    if (channel === 'chat') {
      msgText = customMsg || t('tontine.relance_chat_msg').replace('{name}', memberName);
      logDetails = t('tontine.relance_chat_msg').replace('{name}', memberName);
    } else if (channel === 'whatsapp') {
      msgText = customMsg || t('tontine.relance_template').replace('{name}', memberName).replace('{amount}', tontine.cotisation.toLocaleString('fr-FR')).replace('{tontineName}', tontine.name);
      logDetails = `Rappel de paiement envoyé à ${memberName} via WhatsApp (${customPhone || ''})`;
    } else if (channel === 'sms') {
      msgText = customMsg || t('tontine.relance_template').replace('{name}', memberName).replace('{amount}', tontine.cotisation.toLocaleString('fr-FR')).replace('{tontineName}', tontine.name);
      logDetails = `Rappel de paiement envoyé à ${memberName} via SMS (${customPhone || ''})`;
    }

    const newLog: ActivityLog = {
      id: `log_rem_${Date.now()}`,
      timestamp: timestampStr,
      type: 'paiement',
      user: typeof tontine.organizer === 'string' ? tontine.organizer : tontine.organizer.name,
      details: logDetails
    };

    const newChatMessage: TontineChatMessage = {
      id: `chat_rem_${Date.now()}`,
      sender: 'System',
      text: msgText,
      timestamp: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setTontines(prev => prev.map(t => {
      if (t.id === tontine.id) {
        return {
          ...t,
          members: t.members.map(m => {
            const mName = typeof m === 'string' ? m : m.name;
            if (mName === memberName) {
              if (typeof m === 'string') {
                return {
                  name: m,
                  avatar: '',
                  email: '',
                  phone: customPhone || '',
                  verified: false,
                  reputation: 'nouveau',
                  rate: 100,
                  hasPaidThisRound: false,
                  hasPendingReminder: true
                } as TontineMember;
              } else {
                return {
                  ...m,
                  phone: customPhone || m.phone || '',
                  hasPendingReminder: true
                };
              }
            }
            return m;
          }),
          activityLogs: [newLog, ...t.activityLogs],
          chat: [...t.chat, newChatMessage]
        };
      }
      return t;
    }));

    addNotification(t('tontine.relance_success').replace('{name}', memberName));
  };

  const handleApplyPenalty = (tontine: Tontine, memberName: string) => {
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const penaltyAmount = 500;

    const newLog: ActivityLog = {
      id: `log_pen_${Date.now()}`,
      timestamp: timestampStr,
      type: 'sanction',
      user: typeof tontine.organizer === 'string' ? tontine.organizer : tontine.organizer.name,
      details: `Pénalité de ${penaltyAmount} FCFA appliquée à ${memberName} pour retard de cotisation.`
    };

    const newChatMessage: TontineChatMessage = {
      id: `chat_pen_${Date.now()}`,
      sender: 'System',
      text: `⚠️ Une pénalité de ${penaltyAmount} FCFA a été appliquée à ${memberName} pour retard de contribution.`,
      timestamp: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setTontines(prev => prev.map(t => {
      if (t.id === tontine.id) {
        return {
          ...t,
          members: t.members.map(m => {
            if (m.name === memberName) {
              const currentPenalties = m.penalties || 0;
              return { 
                ...m, 
                penalties: currentPenalties + penaltyAmount,
                reputation: m.reputation === 'excellent' ? 'fiable' : m.reputation === 'fiable' ? 'surveillance' : m.reputation === 'nouveau' ? 'surveillance' : m.reputation,
                rate: Math.max(30, m.rate - 5)
              };
            }
            return m;
          }),
          activityLogs: [newLog, ...t.activityLogs],
          chat: [...t.chat, newChatMessage]
        };
      }
      return t;
    }));

    addNotification(`⚠️ Pénalité de ${penaltyAmount} FCFA appliquée avec succès à ${memberName}.`);
  };

  // -----------------------------------------
  // RÉCUPÉRATION DU COMPTE TONTINE EXPLICIT
  // -----------------------------------------
  const currentTontine = tontines.find(t => t.id === selectedTontineId) || null;

  // Dynamic SEO management
  const seoTitle = selectedTontineId && currentTontine 
    ? `Tontine : ${currentTontine.name}` 
    : activeTab === 'create' 
      ? 'Créer une tontine' 
      : 'Tontines de Confiance';
  
  const seoDesc = selectedTontineId && currentTontine 
    ? currentTontine.description.slice(0, 160) + (currentTontine.description.length > 160 ? '...' : '')
    : activeTab === 'create'
      ? 'Créez un cercle d\'épargne rotatif (Tontine) sécurisé avec contrat d\'engagement sur Sunu Yité.'
      : 'Gérez et participez à des tontines numériques communautaires et transparentes au Sénégal.';

  useSEO({
    title: seoTitle,
    description: seoDesc,
    keywords: 'Sénégal, tontine, épargne, crédit rotatif, confiance, solidarité, finances'
  });

    return (
    <>
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
            <div className="horizontal-scroll-tabs">
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
                    onNavigate('profile', { requireCompletion: true, target: 'kyc' });
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
          <div style={{ flex: '2 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {currentTontine ? (
              <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
                                {currentTontine.coverImage && (
                  <div style={{ height: '180px', width: '100%', backgroundImage: `url("${currentTontine.coverImage}")`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: '1px solid var(--border-light)' }} />
                )}
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currentTontine.name}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
                      Organisateur : {(() => {
                        const orgName = typeof currentTontine.organizer === 'string' ? currentTontine.organizer : currentTontine.organizer?.name;
                        const orgMatch = usersList.find(u => u.name && orgName && u.name.toLowerCase() === orgName.toLowerCase());
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
                            {orgName}
                          </strong>
                        );
                      })()} | Type : <strong>{currentTontine.type === 'public' ? 'Public' : 'Privé'}</strong>
                    </span>
                  </div>
                  {currentTontine.members.some(m => (typeof m === 'string' ? m : m.name)?.toLowerCase() === (currentUser?.name || '').toLowerCase()) ? (
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
                                <div className="horizontal-scroll-tabs" style={{ fontSize: '0.8rem' }}>
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
                    {/* Tontine Type specific info & Description */}
                    <div style={{ display: 'flex', gap: '1rem', background: 'rgba(6, 78, 59, 0.03)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Genre de Tontine</span>
                        <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--primary)', marginTop: '0.2rem' }}>
                          {currentTontine.tontineType === 'product' ? '📦 Tontine Produit (Biens & Équipements)' : '💵 Tontine Argent (Fintech)'}
                        </strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginTop: '0.5rem', lineHeight: 1.4 }}>
                          {currentTontine.description}
                        </p>
                      </div>
                      
                      {currentTontine.tontineType === 'product' && currentTontine.productImages && currentTontine.productImages.length > 0 && (
                        <div style={{ flex: 1, minWidth: '240px', textAlign: 'left' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block', marginBottom: '0.4rem' }}>Photos du produit ({currentTontine.productImages.length})</span>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {currentTontine.productImages.map((img, i) => (
                              <img 
                                key={i} 
                                src={img} 
                                alt="Produit" 
                                style={{ width: '60px', height: '60px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-light)', cursor: 'pointer' }}
                                onClick={() => window.open(img, '_blank')}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ring members list with reputation badges */}
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>👥 Membres actifs et Score de Confiance :</strong>
                      <div className="grid-cols-2" style={{ gap: '1rem', marginTop: '0.5rem' }}>
                        {currentTontine.members.map((member: any, i) => {
                          const mName = typeof member === 'string' ? member : member?.name;
                          const mReputation = typeof member === 'string' ? 'nouveau' : (member?.reputation || 'nouveau');
                          const mRate = typeof member === 'string' ? 100 : (member?.rate || 100);
                          const mPaid = typeof member === 'string' ? false : (member?.hasPaidThisRound || false);
                          const memMatch = usersList.find(u => u.name && mName && u.name.toLowerCase() === mName.toLowerCase());
                                                    const org = currentTontine.organizer as any;
                          const isOrganizer = currentUser && (
                            typeof org === 'string' 
                              ? org.toLowerCase() === currentUser.name.toLowerCase() 
                              : org?.name?.toLowerCase() === currentUser.name.toLowerCase()
                          );

                          // Reputation styles
                          let repColor = '#92400e';
                          let repBg = '#fef3c7';
                          let repText = '🥉 Nouveau';
                          if (mReputation === 'excellent') {
                            repColor = '#065f46';
                            repBg = '#d1fae5';
                            repText = '🥇 Excellent';
                          } else if (mReputation === 'fiable') {
                            repColor = '#1e40af';
                            repBg = '#dbeafe';
                            repText = '🥈 Fiable';
                          } else if (mReputation === 'surveillance') {
                            repColor = '#854d0e';
                            repBg = '#fef9c3';
                            repText = '⚠️ Surveillance';
                          } else if (mReputation === 'sanctionne') {
                            repColor = '#991b1b';
                            repBg = '#fee2e2';
                            repText = '❌ Sanctionné';
                          }

                          return (
                            <div 
                              key={i} 
                              className="premium-card" 
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                gap: '0.75rem',
                                padding: '1rem',
                                border: '1px solid var(--border-light)',
                                background: 'var(--light-card)',
                                borderRadius: 'var(--radius-md)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {/* Avatar */}
                                <div 
                                  style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #064e3b 100%)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    border: '2px solid white',
                                    boxShadow: 'var(--shadow-sm)',
                                    cursor: memMatch ? 'pointer' : 'default',
                                    overflow: 'hidden'
                                  }}
                                  onClick={() => {
                                    if (memMatch) setSelectedPublicUserId(memMatch.id);
                                  }}
                                >
                                  {memMatch?.avatar ? (
                                    <img src={memMatch.avatar} alt={mName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    mName.charAt(0).toUpperCase()
                                  )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'left' }}>
                                  <span 
                                    style={{ 
                                      fontWeight: 'bold', 
                                      fontSize: '0.9rem',
                                      textDecoration: memMatch ? 'underline' : 'none', 
                                      color: memMatch ? 'var(--primary)' : 'inherit',
                                      cursor: memMatch ? 'pointer' : 'default'
                                    }}
                                    onClick={() => {
                                      if (memMatch) setSelectedPublicUserId(memMatch.id);
                                    }}
                                    title={memMatch ? "Voir le profil de ce membre" : undefined}
                                  >
                                    {mName}
                                  </span>
                                  
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <span 
                                      style={{ 
                                        fontSize: '0.65rem', 
                                        background: repBg,
                                        color: repColor,
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '10px',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      {repText}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', fontWeight: 'bold' }}>
                                      Taux: {mRate}%
                                    </span>
                                    {member.penalties && member.penalties > 0 ? (
                                      <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#991b1b', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 'bold' }}>
                                        ⚠️ {member.penalties} F
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              {/* Payment status badge for current round */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text-secondary-light)' }}>Ronde en cours :</span>
                                {mPaid ? (
                                  <span style={{ background: '#d1fae5', color: '#065f46', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    Payé ✅
                                  </span>
                                ) : (
                                  <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 'bold', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                                    En attente ⏳
                                  </span>
                                )}
                              </div>

                              {/* Organizer buttons */}
                              {isOrganizer && !mPaid && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                  <button 
                                    className="btn btn-primary"
                                    style={{ 
                                      flex: 1, 
                                      padding: '0.4rem 0.6rem', 
                                      fontSize: '0.75rem', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      gap: '0.25rem',
                                      minWidth: 'auto',
                                      borderRadius: '4px'
                                    }}
                                    onClick={() => setReminderModalData({ tontine: currentTontine, memberName: mName, phone: member.phone })}
                                  >
                                    🔔 {t('tontine.relancer_btn')}
                                  </button>
                                  <button 
                                    className="btn btn-outline"
                                    style={{ 
                                      padding: '0.4rem 0.6rem', 
                                      fontSize: '0.75rem', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      gap: '0.25rem',
                                      minWidth: 'auto',
                                      borderColor: 'var(--danger)',
                                      color: 'var(--danger)',
                                      borderRadius: '4px'
                                    }}
                                    onClick={() => handleApplyPenalty(currentTontine, mName)}
                                  >
                                    ⚠️ Sanctionner
                                  </button>
                                </div>
                              )}
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
                          const isMe = (msg.sender || '').toLowerCase() === (currentUser?.name || '').toLowerCase();
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Genre de Tontine</label>
                <div style={{ display: 'flex', gap: '1rem', height: '38px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input 
                      type="radio" 
                      name="tontineType" 
                      value="money" 
                      checked={tontineType === 'money'}
                      onChange={() => setTontineType('money')} 
                    />
                    💵 Argent
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                    <input 
                      type="radio" 
                      name="tontineType" 
                      value="product" 
                      checked={tontineType === 'product'}
                      onChange={() => setTontineType('product')} 
                    />
                    📦 Produit
                  </label>
                </div>
              </div>

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
            </div>

            {tontineType === 'product' && (
              <div className="animate-slide-up" style={{ padding: '0.75rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Photos du Produit (Max 5 photos)
                </label>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {productImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                      <img src={img} alt={`Produit ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(239, 68, 68, 0.85)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        onClick={() => setProductImages(prev => prev.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {productImages.length < 5 && (
                    <button
                      type="button"
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '4px',
                        border: '1px dashed var(--border-light)',
                        background: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary-light)',
                        cursor: 'pointer',
                        gap: '2px'
                      }}
                      onClick={() => document.getElementById('tontine-product-uploads')?.click()}
                    >
                      ➕
                      <span>Photos</span>
                    </button>
                  )}
                </div>

                <input 
                  id="tontine-product-uploads"
                  type="file" 
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    const availableSlots = 5 - productImages.length;
                    const filesToUpload = files.slice(0, availableSlots);
                    
                    for (const file of filesToUpload) {
                      if (file.size > 1 * 1024 * 1024) {
                        alert(`Le fichier ${file.name} dépasse la limite maximale de 1 Mo. 🇸🇳`);
                        continue;
                      }
                      
                      const reader = new FileReader();
                      reader.onload = () => {
                        compressImage(reader.result as string).then(compressed => {
                          uploadBase64ToStorage(compressed, 'tontines').then(storageUrl => {
                            setProductImages(prev => [...prev, storageUrl]);
                          });
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>
                  Chargez jusqu'à 5 photos claires du ou des produits à acquérir.
                </span>
              </div>
            )}

            <div className="grid-cols-3" style={{ gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Cotisation (FCFA) *</label>
                <input 
                  type="number" 
                  required
                  min={100}
                  placeholder="Ex : 10000" 
                  className="premium-card" 
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                  value={cotisation || ''}
                  onChange={(e) => setCotisation(parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Participants Max *</label>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Photo de couverture de la Tontine</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="URL de l'image (ou importez un fichier)" 
                  className="premium-card" 
                  style={{ flex: 1, padding: '0.6rem', background: 'var(--light)', color: 'var(--text-primary-light)' }}
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '0.6rem 1rem', fontSize: '0.75rem' }}
                  onClick={() => document.getElementById('tontine-cover-upload')?.click()}
                >
                  📁 Fichier
                </button>
                <input 
                  id="tontine-cover-upload"
                  type="file" 
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1 * 1024 * 1024) {
                        alert("L'image dépasse la limite maximale autorisée de 1 Mo. Veuillez choisir une image plus légère. 🇸🇳");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        compressImage(reader.result as string).then(compressed => {
                          uploadBase64ToStorage(compressed, 'tontines').then(storageUrl => {
                            setCoverImage(storageUrl);
                          });
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
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

      </div>

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
                                            backgroundImage: verifAvatar ? `url("${verifAvatar}")` : 'none',
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

                                          <div style={{ background: 'rgba(0,133,63,0.03)', border: '1px dashed var(--primary)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span>🔒</span>
                <span style={{ color: 'var(--text-secondary-light)' }}>
                  Paiement sécurisé conforme PCI-DSS traité via <strong>PayTech</strong>.
                </span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.65rem' }}
                disabled={isPaying}
              >
                {isPaying ? 'Connexion à Paystack...' : `Payer ${paymentTontine.cotisation.toLocaleString('fr-FR')} F ➔`}
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

      {/* KYC Blocker Modal */}
      {(() => {
        if (!showKycBlocker) return null;
        const status = currentUser?.verificationStatus || 'none';
        const rejectReason = currentUser?.kycRejectReason || '';
        return (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem'
            }}
            onClick={() => setShowKycBlocker(false)}
          >
            <div 
              className="glass animate-fade-in"
              style={{
                maxWidth: '500px',
                width: '100%',
                background: 'var(--light-card)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-lg)',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🪪</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--primary)' }}>
                Vérification d'identité requise (KYC)
              </h3>
              
              {status === 'pending' ? (
                <p style={{ color: 'var(--text-primary-light)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Votre dossier de vérification d'identité est actuellement en cours de modération. Nos administrateurs l'analysent sous 24h. Vous recevrez une notification dès sa validation.
                </p>
              ) : status === 'rejected' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--danger)', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Votre dossier KYC a été rejeté par les administrateurs.
                  </p>
                  {rejectReason && (
                    <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px dashed var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '1rem' }}>
                      <strong>Motif du rejet :</strong> {rejectReason}
                    </div>
                  )}
                  <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem' }}>
                    Veuillez mettre à jour vos pièces d'identité et votre selfie dans votre espace profil.
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-primary-light)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  Pour garantir la sécurité et la transparence de notre plateforme citoyenne, vous devez faire certifier votre compte (KYC) en transmettant votre pièce d'identité avant de pouvoir participer ou créer une tontine.
                </p>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem 1.5rem' }}
                  onClick={() => setShowKycBlocker(false)}
                >
                  Fermer
                </button>
                {status !== 'pending' && (
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => {
                      setShowKycBlocker(false);
                      onNavigate('profile', { requireCompletion: true, target: 'kyc' });
                    }}
                  >
                    Passer le KYC 🪪
                  </button>
                )}
              </div>
            </div>
          </div>
        );
            })()}

      {/* ==================================================== */}
      {/* MODAL 7 : RELANCE MULTI-CANAL                       */}
      {/* ==================================================== */}
      {reminderModalData && (
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
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <strong style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {t('tontine.relance_modal.title')}
              </strong>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} 
                onClick={() => setReminderModalData(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                {t('tontine.relance_modal.subtitle').replace('{name}', reminderModalData.memberName)}
              </p>

              {/* Channel selections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Chat Group - Always active */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <input type="checkbox" checked disabled id="inapp-chat-opt" />
                  <label htmlFor="inapp-chat-opt" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>
                    {t('tontine.relance_modal.inapp')}
                  </label>
                </div>

                {/* WhatsApp */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <input 
                    type="checkbox" 
                    checked={sendViaWhatsApp} 
                    onChange={(e) => setSendViaWhatsApp(e.target.checked)} 
                    id="whatsapp-opt" 
                  />
                  <label htmlFor="whatsapp-opt" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary-light)', cursor: 'pointer' }}>
                    {t('tontine.relance_modal.whatsapp')}
                  </label>
                </div>

                {/* SMS */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <input 
                    type="checkbox" 
                    checked={sendViaSms} 
                    onChange={(e) => setSendViaSms(e.target.checked)} 
                    id="sms-opt" 
                  />
                  <label htmlFor="sms-opt" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary-light)', cursor: 'pointer' }}>
                    {t('tontine.relance_modal.sms')}
                  </label>
                </div>
              </div>

              {/* Phone number field (shown if WhatsApp or SMS selected) */}
              {(sendViaWhatsApp || sendViaSms) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Numéro de téléphone :</label>
                  <input 
                    type="text" 
                    className="input" 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }} 
                    placeholder={t('tontine.relance_modal.phone_placeholder')}
                    value={customReminderPhone}
                    onChange={(e) => setCustomReminderPhone(e.target.value)}
                  />
                </div>
              )}

              {/* Customized message field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Message personnalisé :</label>
                <textarea 
                  className="input" 
                  style={{ fontSize: '0.8rem', padding: '0.5rem', minHeight: '80px', resize: 'vertical' }} 
                  value={customReminderMsg}
                  onChange={(e) => setCustomReminderMsg(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {/* Standard Send button (always triggers in-app and WhatsApp if selected) */}
                <button 
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.65rem' }}
                  onClick={() => {
                    const tontine = reminderModalData.tontine;
                    const mName = reminderModalData.memberName;

                    // 1. Send in-app chat message
                    handleSendPaymentReminder(tontine, mName, 'chat', customReminderPhone, customReminderMsg);

                    // 2. Send via WhatsApp if selected
                    if (sendViaWhatsApp) {
                      handleSendPaymentReminder(tontine, mName, 'whatsapp', customReminderPhone, customReminderMsg);
                      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(customReminderPhone)}&text=${encodeURIComponent(customReminderMsg)}`;
                      window.open(waUrl, '_blank');
                    }

                    // 3. Send via SMS if selected (simulate)
                    if (sendViaSms) {
                      handleSendPaymentReminder(tontine, mName, 'sms', customReminderPhone, customReminderMsg);
                    }

                    setReminderModalData(null);
                  }}
                >
                  {t('tontine.relance_modal.btn_send')}
                </button>

                {/* Specific SMS Native link button (shown only if SMS is selected) */}
                {sendViaSms && (
                  <button 
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                    onClick={() => {
                      const tontine = reminderModalData.tontine;
                      const mName = reminderModalData.memberName;

                      // Triggers in-app logging + native SMS
                      handleSendPaymentReminder(tontine, mName, 'sms', customReminderPhone, customReminderMsg);
                      
                      const smsUrl = `sms:${customReminderPhone}?body=${encodeURIComponent(customReminderMsg)}`;
                      window.open(smsUrl, '_blank');
                      setReminderModalData(null);
                    }}
                  >
                    📱 Ouvrir l'application SMS natif
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Tontines;
