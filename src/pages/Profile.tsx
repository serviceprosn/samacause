import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { uploadBase64ToStorage } from '../services/supabaseClient';
import { BadgeList } from '../components/BadgeList';
import { TrustScore } from '../components/TrustScore';

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
      if (!ctx) {
        resolve(base64Str);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

const VerifiedRosette: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path 
      d="M12 2.69l1.45 1.45.69 1.95 2.05.28.07 2.07 1.83.98-.6 1.98.98 1.83-2.07.07-.28 2.05-1.95.69-1.45 1.45-1.45-1.45-.95-.69-2.05-.28-.07-2.07-1.83-.98.6-1.98-.98-1.83 2.07-.07.28-2.05 1.95-.69L12 2.69z" 
      fill="#3b82f6" 
    />
    <path 
      d="M9.5 12l1.75 1.75 3.25-3.25" 
      stroke="white" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
);

interface ProfileProps {
  onNavigate?: (page: string, params?: any) => void;
  initialParams?: any;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate, initialParams }) => {
  const { 
    currentUser, 
    petitions, 
    cagnottes, 
    volunteerApplications, 
    logout, 
    updateProfile, 
    addNotification,
    usersList,
    unfollowUser,
    setSelectedPublicUserId,
    deleteAccount,
    withdrawalRequests,
    submitWithdrawalRequest,
    directMessages,
    activeChatUserId,
    setActiveChatUserId,
    sendDirectMessage,
    markMessagesAsRead,
    isMobileView
  } = useApp();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'messages' | 'withdrawals'>('dashboard');
  const [withdrawalAmount, setWithdrawalAmount] = useState<number | ''>('');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'wave' | 'orange_money' | 'free_money' | 'virement'>('wave');
  const [withdrawalPhone, setWithdrawalPhone] = useState('');
  const [chatInputText, setChatInputText] = useState('');

  const messagesBodyRef = React.useRef<HTMLDivElement | null>(null);

  // Auto scroll chat to bottom when activeChatUserId changes or new messages arrive
  const activeChatMessages = directMessages.filter(m => 
    currentUser && activeChatUserId && (
      (m.senderId === currentUser.id && m.receiverId === activeChatUserId) ||
      (m.senderId === activeChatUserId && m.receiverId === currentUser.id)
    )
  );

  useEffect(() => {
    if (messagesBodyRef.current) {
      messagesBodyRef.current.scrollTop = messagesBodyRef.current.scrollHeight;
    }
  }, [activeChatMessages.length, activeChatUserId]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCountry, setEditCountry] = useState('Sénégal');
  const [editRegion, setEditRegion] = useState('Dakar');

  // Advanced Identity Verification states
  const [editCniNumber, setEditCniNumber] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editIdRecto, setEditIdRecto] = useState('');
  const [editIdVerso, setEditIdVerso] = useState('');
  const [editSelfie, setEditSelfie] = useState('');
  const [editVerificationStatus, setEditVerificationStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none');

  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [isDirectUpload, setIsDirectUpload] = useState(false);

  // Camera Overlay and Biometric Simulation states
  const [cameraTarget, setCameraTarget] = useState<'recto' | 'verso' | 'selfie' | 'avatar' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'scan' | 'ocr' | 'face' | 'success' | 'failed' | 'none'>('none');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone);
      setEditAvatar(currentUser.avatar);
      setEditBio(currentUser.bio || '');
      setEditAddress(currentUser.address || '');
      setEditCountry(currentUser.country || 'Sénégal');
      setEditRegion(currentUser.region || 'Dakar');
      setEditCniNumber(currentUser.cniNumber || '');
      setEditDob(currentUser.dob || '');
      setEditIdRecto(currentUser.idCardRecto || '');
      setEditIdVerso(currentUser.idCardVerso || '');
      setEditSelfie(currentUser.selfie || '');
      setEditVerificationStatus(currentUser.verificationStatus || 'none');
    }
  }, [currentUser]);

  // Lock body scroll when profile modals are active
  useEffect(() => {
    if (isVerifying || cameraTarget !== null || showAvatarOptions) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isVerifying, cameraTarget, showAvatarOptions]);

  // Callback Ref to bind camera stream safely when video node is mounted
  const videoRefCallback = React.useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
    }
  }, []);

  // Camera capture methods
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Accès caméra impossible : le protocole sécurisé (HTTPS) est requis ou la caméra n'est pas supportée.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: (cameraTarget === 'selfie' || cameraTarget === 'avatar') ? 'user' : 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Impossible d'accéder à la caméra. Veuillez autoriser l'accès ou téléverser un fichier.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (cameraTarget) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [cameraTarget]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraTarget === 'selfie' || cameraTarget === 'avatar') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const rawBase64 = canvas.toDataURL('image/jpeg');
        compressImage(rawBase64).then((base64) => {
          uploadBase64ToStorage(base64, 'profiles').then((storageUrl) => {
            if (cameraTarget === 'recto') setEditIdRecto(storageUrl);
            else if (cameraTarget === 'verso') setEditIdVerso(storageUrl);
            else if (cameraTarget === 'selfie') setEditSelfie(storageUrl);
            else if (cameraTarget === 'avatar') {
              setEditAvatar(storageUrl);
              if (isDirectUpload && currentUser) {
                updateProfile(
                  currentUser.name,
                  currentUser.phone,
                  storageUrl,
                  currentUser.bio || '',
                  currentUser.address || '',
                  currentUser.country,
                  currentUser.region,
                  currentUser.idCardRecto,
                  currentUser.idCardVerso,
                  currentUser.selfie,
                  currentUser.verificationStatus,
                  currentUser.cniNumber,
                  currentUser.dob
                );
                addNotification('📸 Photo de profil mise à jour avec succès !');
              }
            }
          });
        });
        
        setCameraTarget(null);
        addNotification("📷 Capture photo réussie !");
      }
    }
  };

  // simplified validation flow (removing automated biometric restrictions)
  const runBiometricVerification = () => {
    setVerificationError(null);

    // Basic fields validation
    if (!editCniNumber || !editCniNumber.trim()) {
      setVerificationError("Vérification échouée : Numéro de carte d'identité (CNI / NIN) manquant.");
      setIsVerifying(true);
      setVerificationStep('failed');
      return;
    }
    if (!editDob || !editDob.trim()) {
      setVerificationError("Vérification échouée : Date de naissance manquante.");
      setIsVerifying(true);
      setVerificationStep('failed');
      return;
    }
    if (!editIdRecto || !editIdVerso) {
      setVerificationError("Vérification échouée : Les photos Recto et Verso de votre pièce d'identité sont requises.");
      setIsVerifying(true);
      setVerificationStep('failed');
      return;
    }
    if (!editSelfie) {
      setVerificationError("Vérification échouée : Le selfie de contrôle est requis.");
      setIsVerifying(true);
      setVerificationStep('failed');
      return;
    }

    setIsVerifying(true);
    setVerificationStep('scan');
    setVerificationProgress(20);

    // 1. Numérisation (600ms)
    setTimeout(() => {
      setVerificationProgress(50);
      setVerificationStep('ocr');

      // 2. Analyse des documents (600ms)
      setTimeout(() => {
        setVerificationProgress(80);
        setVerificationStep('face');

        // 3. Préparation du dossier (600ms)
        setTimeout(() => {
          setVerificationProgress(100);
          setVerificationStep('success');
          setEditVerificationStatus('pending');
          
          updateProfile(
            editName,
            editPhone,
            editAvatar,
            editBio,
            editAddress,
            editCountry,
            editRegion,
            editIdRecto,
            editIdVerso,
            editSelfie,
            'pending',
            editCniNumber,
            editDob
          ).then(() => {
            addNotification("⏳ Dossier KYC soumis pour validation !");
          });
        }, 600);
      }, 600);
    }, 600);
  };

  useEffect(() => {
    if (editCountry !== 'Sénégal') {
      setEditRegion('Diaspora');
    }
  }, [editCountry]);

  useEffect(() => {
    if (initialParams?.requireCompletion) {
      if (initialParams.target === 'kyc') {
        setIsEditingKyc(true);
        setIsEditingProfile(false);
      } else {
        setIsEditingProfile(true);
        setIsEditingKyc(false);
      }
      addNotification("Veuillez compléter vos informations d'identification obligatoires.");
    }
    if (initialParams?.target === 'messages') {
      setActiveTab('messages');
    } else if (initialParams?.target === 'withdrawals') {
      setActiveTab('withdrawals');
    }
  }, [initialParams]);

  useEffect(() => {
    if (activeChatUserId) {
      setActiveTab('messages');
    }
  }, [activeChatUserId]);

  const getMissingBasicFields = () => {
    if (!currentUser) return ['Compte'];
    const missing = [];
    if (!currentUser.name || !currentUser.name.trim()) missing.push('Prénom & Nom');
    if (!currentUser.phone || !currentUser.phone.trim()) missing.push('Téléphone Mobile');
    if (!currentUser.country || !currentUser.country.trim()) missing.push('Pays de résidence');
    if (!currentUser.region || !currentUser.region.trim()) missing.push("Région d'impact");
    if (!currentUser.address || !currentUser.address.trim()) missing.push('Adresse Physique');
    
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
    if (!currentUser.avatar || !currentUser.avatar.trim() || currentUser.avatar === defaultAvatar) {
      missing.push('Photo de profil personnalisée');
    }
    return missing;
  };

  const getMissingKycFields = () => {
    if (!currentUser) return ['KYC'];
    const missing = [];
    if (!currentUser.cniNumber || !currentUser.cniNumber.trim()) missing.push("Numéro de CNI / Passeport");
    if (!currentUser.dob || !currentUser.dob.trim()) missing.push("Date de naissance");
    if (!currentUser.idCardRecto || !currentUser.idCardRecto.trim()) missing.push("Pièce d'identité (Recto)");
    if (!currentUser.idCardVerso || !currentUser.idCardVerso.trim()) missing.push("Pièce d'identité (Verso)");
    if (!currentUser.selfie || !currentUser.selfie.trim()) missing.push("Selfie de contrôle");
    if (currentUser.verificationStatus !== 'verified') missing.push("Vérification biométrique d'identité");
    return missing;
  };

  const missingBasicFields = getMissingBasicFields();
  const missingKycFields = getMissingKycFields();
  const isBasicIncomplete = missingBasicFields.length > 0;
  const isKycIncomplete = missingKycFields.length > 0;
  const isProfileIncomplete = isBasicIncomplete || isKycIncomplete;

  if (!currentUser) {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem' }}>👤</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem' }}>Espace Citoyen</h2>
        <p style={{ color: 'var(--text-secondary-light)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Connectez-vous pour accéder à votre profil, vos badges et l'historique de vos contributions.
        </p>
      </div>
    );
  }

  // Calculate stats based on current user name in mock data
  const signedPetitionsCount = petitions.filter(p => 
    p.signers.some(s => (s.name || '').toLowerCase() === (currentUser?.name || '').toLowerCase())
  ).length;

  const userDonations = cagnottes.reduce((list: any[], c) => {
    const matchingDons = c.donors.filter(d => (d.name || '').toLowerCase() === (currentUser?.name || '').toLowerCase());
    matchingDons.forEach(d => {
      list.push({ cagnotteTitle: c.title, amount: d.amount, date: d.date });
    });
    return list;
  }, []);

  const totalDonated = userDonations.reduce((sum, d) => sum + d.amount, 0);

  const appliedMissionsCount = volunteerApplications.filter(a => 
    (a.userName || '').toLowerCase() === (currentUser?.name || '').toLowerCase()
  ).length;

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(
      editName, 
      editPhone, 
      editAvatar, 
      editBio, 
      editAddress, 
      editCountry, 
      editRegion,
      editIdRecto,
      editIdVerso,
      editSelfie,
      editVerificationStatus,
      editCniNumber,
      editDob
    );
    setIsEditingProfile(false);
    addNotification('✏️ Profil de base mis à jour avec succès !');
  };

  return (
    <>
      <div className="animate-fade-in animate-slide-up" style={{ paddingBottom: '3rem' }}>
      {/* WARNING BANNER FOR INCOMPLETE PROFILE */}
      {currentUser.verificationStatus === 'pending' ? (
        <div 
          className="premium-card animate-fade-in" 
          style={{ 
            background: 'rgba(252, 209, 22, 0.05)', 
            border: '1.5px solid var(--secondary)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <strong style={{ color: 'var(--secondary-dark)', fontSize: '1.05rem' }}>
              {t('profile.kyc.pending')}
            </strong>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: 0, lineHeight: '1.4' }}>
            Vos documents (pièce d'identité et selfie de contrôle) ont été soumis. Un administrateur examine actuellement votre dossier pour valider votre profil citoyen. Vous recevrez une notification dès que la vérification sera complétée.
          </p>
        </div>
      ) : isBasicIncomplete ? (
        <div 
          className="premium-card animate-fade-in" 
          style={{ 
            background: 'rgba(217, 83, 79, 0.05)', 
            border: '1.5px solid var(--danger)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <strong style={{ color: 'var(--danger)', fontSize: '1.05rem' }}>
              Coordonnées de profil requises
            </strong>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: 0, lineHeight: '1.4' }}>
            Pour pouvoir lancer une cagnotte, créer une pétition ou rejoindre des activités, veuillez renseigner les informations de contact de base suivantes :
          </p>
          <ul style={{ fontSize: '0.85rem', color: 'var(--danger)', margin: '0.25rem 0 0 1.25rem', padding: 0, fontWeight: 600 }}>
            {missingBasicFields.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {initialParams?.requireCompletion && initialParams?.target !== 'kyc' && (
            <div style={{ marginTop: '0.5rem', background: 'rgba(217, 83, 79, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger)' }}>
              🔒 Les coordonnées de base de profil sont nécessaires pour pouvoir accéder au hub de création de campagnes.
            </div>
          )}
        </div>
      ) : isKycIncomplete ? (
        <div 
          className="premium-card animate-fade-in" 
          style={{ 
            background: 'rgba(54, 162, 235, 0.05)', 
            border: '1.5px solid var(--primary)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
            <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
              Vérification d'identité requise pour les services financiers
            </strong>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: 0, lineHeight: '1.4' }}>
            Votre profil de base est prêt. Le KYC est requis uniquement pour lancer des cagnottes solidaires ou participer aux tontines.
          </p>
          {initialParams?.requireCompletion && initialParams?.target === 'kyc' && (
            <div style={{ marginTop: '0.5rem', background: 'rgba(54, 162, 235, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>
              🔒 La certification d'identité biométrique (KYC) est strictement obligatoire pour pouvoir accéder et participer aux Tontines ou lancer une cagnotte.
            </div>
          )}
        </div>
      ) : null}

      {/* PROFILE CARD */}
      <div 
        className="premium-card" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2rem', 
          background: 'linear-gradient(135deg, rgba(0, 133, 63, 0.02) 0%, rgba(252, 209, 22, 0.02) 100%)',
          border: '1.5px solid var(--border-light)',
          padding: '2rem',
          flexWrap: 'wrap',
          marginBottom: '2.5rem'
        }}
      >
        <div 
          onClick={() => {
            setEditAvatar(currentUser.avatar || '');
            setIsDirectUpload(true);
            setShowAvatarOptions(true);
          }}
          style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: '50%', 
            backgroundImage: `url("${currentUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: 'var(--shadow-md)',
            border: '3px solid white',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} 
          title="Cliquez pour voir ou modifier votre photo de profil"
        >
          {currentUser.verificationStatus === 'verified' && (
            <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'white', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <VerifiedRosette size={18} />
            </div>
          )}
          {/* Subtle hover overlay to prompt upload */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.4)',
              opacity: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              transition: 'var(--transition-fast)',
              borderRadius: '50%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
          >
            👁️📷
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {currentUser.name} {currentUser.verificationStatus === 'verified' && <VerifiedRosette />}
            </h2>
            <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
              {currentUser.role === 'admin' ? '🛡️ Administrateur' : (currentUser.accountType === 'ngo' ? '🤝 ONG' : currentUser.accountType === 'company' ? '🏢 Entreprise' : '👤 Citoyen')}
            </span>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', marginBottom: '0.5rem' }}>
            📧 {currentUser.email} | 📱 {currentUser.phone}
            {currentUser.address && ` | 📍 ${currentUser.address}`}
            {currentUser.country && ` | 🏳️ ${currentUser.country}`}
            {currentUser.region && currentUser.region !== 'Diaspora' && ` (${currentUser.region})`}
          </p>

          {currentUser.bio && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', fontStyle: 'italic', marginBottom: '0.75rem', borderLeft: '2.5px solid var(--primary)', paddingLeft: '0.5rem' }}>
              "{currentUser.bio}"
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <TrustScore score={currentUser.trustScore} />
            {currentUser.verificationStatus === 'verified' ? (
              <span style={{ fontSize: '0.75rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(0,133,63,0.2)' }}>
                🛡️ Identité Certifiée
              </span>
            ) : currentUser.verificationStatus === 'pending' ? (
              <span style={{ fontSize: '0.75rem', background: 'rgba(252,209,22,0.15)', color: 'var(--secondary-dark)', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(252,209,22,0.3)' }}>
                ⏳ Certification en cours
              </span>
            ) : currentUser.verificationStatus === 'rejected' ? (
              <span style={{ fontSize: '0.75rem', background: 'rgba(217,83,79,0.1)', color: 'var(--danger)', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(217,83,79,0.2)' }}>
                ❌ KYC rejeté (Veuillez resoumettre)
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', background: 'rgba(217,83,79,0.1)', color: 'var(--danger)', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(217,83,79,0.2)' }}>
                ⚠️ Non vérifié (KYC requis)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
            <button 
              className="btn" 
              style={{ 
                padding: '0.55rem 1.25rem', 
                fontSize: '0.85rem', 
                borderRadius: 'var(--radius-sm)',
                background: isEditingProfile ? 'var(--border-light)' : 'var(--primary)',
                color: isEditingProfile ? 'inherit' : 'white',
                border: isEditingProfile ? '1px solid var(--border-light)' : '1px solid var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: isEditingProfile ? 'none' : '0 3px 6px rgba(0, 133, 63, 0.25)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                setIsEditingProfile(!isEditingProfile);
                setIsEditingKyc(false);
              }}
            >
              {isEditingProfile ? '✕ Fermer l\'édition' : '✏️ Modifier le profil'}
            </button>

            <button 
              className="btn" 
              style={{ 
                padding: '0.55rem 1.25rem', 
                fontSize: '0.85rem', 
                borderRadius: 'var(--radius-sm)',
                background: isEditingKyc ? 'var(--border-light)' : 'var(--secondary-dark)',
                color: isEditingKyc ? 'inherit' : '#1e1e1e',
                border: isEditingKyc ? '1px solid var(--border-light)' : '1px solid var(--secondary-dark)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: isEditingKyc ? 'none' : '0 3px 6px rgba(252, 209, 22, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                setIsEditingKyc(!isEditingKyc);
                setIsEditingProfile(false);
              }}
            >
              {isEditingKyc ? '✕ Fermer le KYC' : '🪪 Passer le KYC'}
            </button>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{signedPetitionsCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>{t('profile.stats.petitions')}</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{(currentUser.availableFunds || 0).toLocaleString('fr-FR')} F</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>{t('profile.stats.funds')}</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{currentUser.followers?.length || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>{t('profile.stats.followers')}</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{currentUser.following?.length || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>Abonnements</div>
          </div>
        </div>
      </div>

      {/* TABS HEADERS */}
      <div 
        style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--border-light)', 
          marginBottom: '2rem',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '0.75rem 0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary-light)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          📊 Tableau de Bord
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('withdrawals')}
          style={{
            padding: '0.75rem 0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'withdrawals' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'withdrawals' ? 'var(--primary)' : 'var(--text-secondary-light)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          🪙 Retraits & Portefeuille
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          style={{
            padding: '0.75rem 0.5rem',
            fontWeight: 800,
            fontSize: '0.95rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'messages' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'messages' ? 'var(--primary)' : 'var(--text-secondary-light)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          💬 Messagerie
          {directMessages.filter(m => m.receiverId === currentUser.id && !m.read).length > 0 && (
            <span 
              style={{ 
                background: 'var(--danger)', 
                color: 'white', 
                fontSize: '0.7rem', 
                fontWeight: 'bold', 
                padding: '0.15rem 0.4rem', 
                borderRadius: '10px' 
              }}
            >
              {directMessages.filter(m => m.receiverId === currentUser.id && !m.read).length}
            </span>
          )}
        </button>
      </div>

      {/* BASIC PROFILE EDITING FORM */}
      {isEditingProfile && (
        <form 
          onSubmit={handleUpdateProfileSubmit} 
          className="premium-card animate-fade-in" 
          style={{ marginBottom: '2.5rem', background: 'var(--light-card)', padding: '2rem' }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>✏️ {t('profile.edit_coords').replace('✏️ ', '')}</h3>
          
          {/* Aperçu de la photo de profil & Sélection d'avatars par défaut */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <div 
              onClick={() => {
                setIsDirectUpload(false);
                setShowAvatarOptions(true);
              }}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundImage: `url("${editAvatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '3px solid var(--primary)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
              title="Cliquez pour voir ou modifier votre photo de profil"
            >
              {/* Hover overlay to prompt edit */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  opacity: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.1rem',
                  transition: 'var(--transition-fast)',
                  borderRadius: '50%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
              >
                👁️📷
              </div>
            </div>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary-light)' }}>
              Photo de profil (cliquez pour voir ou modifier)
            </label>
          </div>

          <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('auth.name_label')}</label>
              <input
                type="text"
                required
                className="premium-card"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('auth.phone_label')}</label>
              <input
                type="text"
                required
                className="premium-card"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Adresse Physique / Ville</label>
            <input
              type="text"
              required
              placeholder="Ex : Parcelles Assainies, Villa 123"
              className="premium-card"
              style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
            />
          </div>

          <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('auth.country_label')}</label>
              <select
                className="premium-card"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
              >
                <option value="Sénégal">Sénégal</option>
                <option value="France">France</option>
                <option value="États-Unis">États-Unis</option>
                <option value="Canada">Canada</option>
                <option value="Italie">Italie</option>
                <option value="Espagne">Espagne</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('auth.region_label')}</label>
              <select
                className="premium-card"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
                value={editRegion}
                onChange={(e) => setEditRegion(e.target.value)}
                disabled={editCountry !== 'Sénégal'}
              >
                <option value="Dakar">Dakar</option>
                <option value="Thiès">Thiès</option>
                <option value="Saint-Louis">Saint-Louis</option>
                <option value="Louga">Louga</option>
                <option value="Diourbel">Diourbel</option>
                <option value="Fatick">Fatick</option>
                <option value="Kaolack">Kaolack</option>
                <option value="Kaffrine">Kaffrine</option>
                <option value="Matam">Matam</option>
                <option value="Tambacounda">Tambacounda</option>
                <option value="Kédougou">Kédougou</option>
                <option value="Kolda">Kolda</option>
                <option value="Sédhiou">Sédhiou</option>
                <option value="Ziguinchor">Ziguinchor</option>
                <option value="Diaspora">Diaspora</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Votre Bio / Engagement Citoyen</label>
            <textarea
              placeholder={t('profile.placeholder.bio')}
              className="premium-card"
              rows={3}
              style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', fontFamily: 'inherit', resize: 'vertical' }}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsEditingProfile(false)}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
            >
              Enregistrer 💾
            </button>
          </div>
        </form>
      )}

      {/* KYC IDENTITY VERIFICATION FORM */}
      {isEditingKyc && (
        <div 
          className="premium-card animate-fade-in" 
          style={{ marginBottom: '2.5rem', background: 'var(--light-card)', padding: '2rem' }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>🪪 {t('tontine.profile.certification').replace('🔒 ', '')}</h3>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
            Pour participer ou lancer des tontines d'épargne ou lancer des cagnottes de financement participatif, la réglementation exige une validation d'identité officielle. Vos données sont cryptées et traitées de manière sécurisée.
          </p>

          <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('profile.kyc.cni_number')}</label>
              <input
                type="text"
                required
                placeholder="Ex : 1 751 1992 01234"
                className="premium-card"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                value={editCniNumber}
                onChange={(e) => setEditCniNumber(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Date de naissance</label>
              <input
                type="date"
                required
                className="premium-card"
                style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                value={editDob}
                onChange={(e) => setEditDob(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-cols-3" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Recto */}
            <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', background: 'var(--light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'space-between', border: editIdRecto ? '1px solid var(--primary)' : '1px dashed var(--border-light)' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block' }}>{t('profile.kyc.cni_recto')}</strong>
              {editIdRecto && editIdRecto !== '[stored]' ? (
                <div style={{ height: '90px', backgroundImage: `url("${editIdRecto}")`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
              ) : editIdRecto === '[stored]' ? (
                <div style={{ height: '90px', background: 'rgba(0,133,63,0.05)', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: 'var(--primary)', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{t('profile.kyc.registered')}</span>
                </div>
              ) : (
                <div style={{ height: '90px', background: 'var(--light-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-secondary-light)', borderRadius: '4px' }}>📄</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%' }} onClick={() => setCameraTarget('recto')}>
                  📸 Prendre en direct
                </button>
                <label className="btn btn-ghost" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%', margin: 0, display: 'inline-block', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                  📁 Importer...
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1 * 1024 * 1024) {
                        alert("L'image dépasse la limite maximale autorisée de 1 Mo. Veuillez choisir une image plus légère. 🇸🇳");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        compressImage(reader.result as string).then(compressed => {
                          uploadBase64ToStorage(compressed, 'profiles').then(storageUrl => setEditIdRecto(storageUrl));
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
            </div>

            {/* Verso */}
            <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', background: 'var(--light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'space-between', border: editIdVerso ? '1px solid var(--primary)' : '1px dashed var(--border-light)' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block' }}>{t('profile.kyc.cni_verso')}</strong>
              {editIdVerso && editIdVerso !== '[stored]' ? (
                <div style={{ height: '90px', backgroundImage: `url("${editIdVerso}")`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
              ) : editIdVerso === '[stored]' ? (
                <div style={{ height: '90px', background: 'rgba(0,133,63,0.05)', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: 'var(--primary)', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Déjà enregistré</span>
                </div>
              ) : (
                <div style={{ height: '90px', background: 'var(--light-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-secondary-light)', borderRadius: '4px' }}>📄</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%' }} onClick={() => setCameraTarget('verso')}>
                  📸 Prendre en direct
                </button>
                <label className="btn btn-ghost" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%', margin: 0, display: 'inline-block', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                  📁 Importer...
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1 * 1024 * 1024) {
                        alert("L'image dépasse la limite maximale autorisée de 1 Mo. Veuillez choisir une image plus légère. 🇸🇳");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        compressImage(reader.result as string).then(compressed => {
                          uploadBase64ToStorage(compressed, 'profiles').then(storageUrl => setEditIdVerso(storageUrl));
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
              </div>
            </div>

            {/* Selfie */}
            <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', background: 'var(--light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'space-between', border: editSelfie ? '1px solid var(--primary)' : '1px dashed var(--border-light)' }}>
              <strong style={{ fontSize: '0.8rem', display: 'block' }}>{t('profile.kyc.selfie')}</strong>
              {editSelfie && editSelfie !== '[stored]' ? (
                <div style={{ height: '90px', backgroundImage: `url("${editSelfie}")`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
              ) : editSelfie === '[stored]' ? (
                <div style={{ height: '90px', background: 'rgba(0,133,63,0.05)', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', color: 'var(--primary)', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>✓</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Déjà enregistré</span>
                </div>
              ) : (
                <div style={{ height: '90px', background: 'var(--light-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-secondary-light)', borderRadius: '4px' }}>👤</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%' }} onClick={() => setCameraTarget('selfie')}>
                  📸 Prendre en direct
                </button>
              </div>
            </div>
          </div>

          {editVerificationStatus !== 'verified' ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', border: 'none', padding: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}
              onClick={runBiometricVerification}
            >
              🪪 Soumettre mon dossier KYC pour validation
            </button>
          ) : (
            <div style={{ background: 'rgba(0,133,63,0.08)', border: '1px solid var(--primary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              🛡️ Votre identité est certifiée et vérifiée en toute sécurité.
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={() => setIsEditingKyc(false)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <>
          {/* GAMIFICATION & BADGES */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>🏅 Badges Citoyens</h3>
            <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem' }}>
              Réalisez des actions de mobilisation pour débloquer de nouveaux badges et augmenter votre indice de score de confiance.
            </p>
            <BadgeList unlockedBadgeIds={currentUser.badges || []} />
          </section>

          {/* MY CAMPAIGNS & Doléances */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>{t('profile.my_launches')}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {petitions.filter(p => p.organizer.id === currentUser.id).length === 0 && 
               cagnottes.filter(c => c.organizer.id === currentUser.id).length === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '2rem', background: 'var(--light-card)' }}>
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                    Vous n'avez pas encore lancé de doléance ou de cagnotte.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Petitions created by me */}
                  {petitions
                    .filter(p => p.organizer.id === currentUser.id)
                    .map(p => (
                      <div 
                        key={`created-pet-${p.id}`} 
                        className="premium-card" 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: 'var(--light-card)',
                          borderLeft: '4px solid var(--primary)',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              PÉTITION
                            </span>
                            <span 
                              style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 'bold',
                                color: p.status === 'active' ? 'var(--primary)' : p.status === 'rejected' ? 'var(--danger)' : 'var(--secondary-dark)'
                              }}
                            >
                              ● {p.status === 'active' ? 'En ligne' : p.status === 'rejected' ? 'Action requise (Rejetée)' : 'En cours de modération'}
                            </span>
                          </div>
                          <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: '0.25rem 0 0.15rem 0' }}>{p.title}</h4>
                          {p.status === 'rejected' && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--danger)', margin: 0 }}>
                              Motif : "{p.rejectionFeedback || 'Non spécifié.'}"
                            </p>
                          )}
                        </div>
                        {onNavigate && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                            onClick={() => {
                              if (p.status === 'active') {
                                onNavigate('petitions', { id: p.id, view: 'detail' });
                              } else {
                                onNavigate('petitions', { id: p.id, view: 'tracking' });
                              }
                            }}
                          >
                            {p.status === 'active' ? 'Voir en direct ➔' : 'Suivre le lancement ➔'}
                          </button>
                        )}
                      </div>
                    ))
                  }

                  {/* Cagnottes created by me */}
                  {cagnottes
                    .filter(c => c.organizer.id === currentUser.id)
                    .map(c => (
                      <div 
                        key={`created-cag-${c.id}`} 
                        className="premium-card" 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: 'var(--light-card)',
                          borderLeft: '4px solid var(--secondary)',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(252,209,22,0.2)', color: 'var(--secondary-dark)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              CAGNOTTE
                            </span>
                            <span 
                              style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 'bold',
                                color: c.status === 'active' ? 'var(--primary)' : c.status === 'rejected' ? 'var(--danger)' : 'var(--secondary-dark)'
                              }}
                            >
                              ● {c.status === 'active' ? 'En ligne' : c.status === 'rejected' ? 'Action requise (Rejetée)' : 'En cours de modération'}
                            </span>
                          </div>
                          <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: '0.25rem 0 0.15rem 0' }}>{c.title}</h4>
                          {c.status === 'rejected' && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--danger)', margin: 0 }}>
                              Motif : "{c.rejectionFeedback || 'Non spécifié.'}"
                            </p>
                          )}
                        </div>
                        {onNavigate && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                            onClick={() => {
                              if (c.status === 'active') {
                                onNavigate('cagnottes', { id: c.id, view: 'detail' });
                              } else {
                                onNavigate('cagnottes', { id: c.id, view: 'tracking' });
                              }
                            }}
                          >
                            {c.status === 'active' ? 'Voir en direct ➔' : 'Suivre le lancement ➔'}
                          </button>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </section>

          {/* ABONNEMENTS & RESEAU */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>✨ Vos Abonnements ({currentUser.following?.length || 0})</h3>
            
            {(currentUser.following?.length || 0) === 0 ? (
              <div className="premium-card" style={{ textAlign: 'center', padding: '2rem', background: 'var(--light-card)' }}>
                <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: 0 }}>
                  Vous ne suivez aucun citoyen, entreprise ou ONG pour le moment.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {(currentUser.following || []).map(followedId => {
                  const followedUser = usersList.find(u => u.id === followedId);
                  if (!followedUser) return null;
                  return (
                    <div 
                      key={followedId} 
                      className="premium-card hover-glow"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'var(--light-card)',
                        border: '1.5px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div 
                        style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '50%',
                          backgroundImage: `url("${followedUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1.5px solid var(--primary)'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {followedUser.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '0.1rem' }}>
                          {followedUser.accountType === 'ngo' ? '🤝 ONG' : followedUser.accountType === 'company' ? '🏢 Entreprise' : '👤 Citoyen'}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', border: '1px solid var(--border-light)', minWidth: 'auto' }}
                            onClick={() => setSelectedPublicUserId(followedUser.id)}
                          >
                            Profil
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: 'var(--danger)', border: '1px solid rgba(217, 83, 79, 0.2)', minWidth: 'auto' }}
                            onClick={() => unfollowUser(followedUser.id)}
                          >
                            Désabonner
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* TIMELINE CONTRIBUTIONS HISTORY */}
          <section>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>📜 Historique de vos Mobilisations</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {signedPetitionsCount === 0 && userDonations.length === 0 && appliedMissionsCount === 0 ? (
                <div className="premium-card" style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                    Aucune contribution enregistrée. Commencez par signer une pétition ou faire un don pour lancer votre historique citoyen.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Petitions signed */}
                  {petitions
                    .filter(p => p.signers.some(s => (s.name || '').toLowerCase() === (currentUser?.name || '').toLowerCase()))
                    .map(p => {
                      const mySig = p.signers.find(s => (s.name || '').toLowerCase() === (currentUser?.name || '').toLowerCase());
                      return (
                        <div key={`sig-${p.id}`} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', background: 'var(--light-card)' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>✍️ SIGNATURE</span>
                            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0.15rem 0' }}>{p.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                              Destinataire : {p.recipient}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>{mySig?.date}</span>
                        </div>
                      );
                    })
                  }

                  {/* Donations made */}
                  {userDonations.map((don, idx) => (
                    <div key={`don-${idx}`} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', background: 'var(--light-card)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary-dark)', fontWeight: 'bold' }}>❤️ DON CITOYEN</span>
                        <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0.15rem 0' }}>{don.cagnotteTitle}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          Reçu fiscal validé sous référence : <strong>TX-{idx}04523</strong>
                        </span>
                      </div>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>
                        +{don.amount.toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>
                  ))}

                  {/* Volunteer applied */}
                  {volunteerApplications
                    .filter(a => (a.userName || '').toLowerCase() === (currentUser?.name || '').toLowerCase())
                    .map(app => {
                      return (
                        <div key={`app-${app.id}`} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', background: 'var(--light-card)' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--info)', fontWeight: 'bold' }}>{t('profile.history.volunteer')}</span>
                            <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0.15rem 0' }}>{t('profile.history.candidacy_sent')}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                              Statut : <strong>{app.status === 'pending' ? 'En cours d\'analyse' : app.status}</strong>
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>{app.appliedAt}</span>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* WITHDRAWALS TAB */}
      {activeTab === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Wallet Summary Card */}
          <div 
            className="premium-card" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(0, 133, 63, 0.05) 0%, rgba(252, 209, 22, 0.05) 100%)',
              border: '1.5px solid rgba(0, 133, 63, 0.15)',
              padding: '2rem',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Solde disponible pour retrait
              </span>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0 0 0' }}>
                {(currentUser.availableFunds || 0).toLocaleString('fr-FR')} FCFA
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
                Ce solde provient de vos gains tontines et de la libération de vos cagnottes actives.
              </p>
            </div>
            
            <div style={{ textAlign: 'center', background: 'white', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', fontWeight: 'bold' }}>Total des dons effectués</div>
              <strong style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>
                {totalDonated.toLocaleString('fr-FR')} FCFA
              </strong>
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '2rem' }}>
            {/* Withdrawal Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const amt = Number(withdrawalAmount);
                if (isNaN(amt) || amt <= 0) {
                  alert("Veuillez saisir un montant valide.");
                  return;
                }
                if (!withdrawalPhone.trim()) {
                  alert("Veuillez saisir le numéro de téléphone pour le transfert.");
                  return;
                }
                const success = await submitWithdrawalRequest(amt, withdrawalMethod, withdrawalPhone);
                if (success) {
                  setWithdrawalAmount('');
                  setWithdrawalPhone('');
                }
              }}
              className="premium-card" 
              style={{ background: 'var(--light-card)', padding: '1.75rem' }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>💸 Demander un retrait</h3>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Montant à retirer (FCFA)</label>
                <input 
                  type="number"
                  required
                  placeholder="Ex : 25000"
                  max={currentUser.availableFunds}
                  min={100}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value ? Number(e.target.value) : '')}
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Mode de paiement</label>
                <select 
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
                  value={withdrawalMethod}
                  onChange={(e: any) => setWithdrawalMethod(e.target.value)}
                >
                  <option value="wave">Wave 🇸🇳</option>
                  <option value="orange_money">Orange Money 🍊</option>
                  <option value="free_money">Free Money 🆓</option>
                  <option value="virement">Virement Bancaire 🏢</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Numéro de téléphone / Coordonnées</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex : +221 77 123 45 67"
                  value={withdrawalPhone}
                  onChange={(e) => setWithdrawalPhone(e.target.value)}
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 'bold' }}
                disabled={(currentUser.availableFunds || 0) <= 0}
              >
                Soumettre la demande de retrait ➔
              </button>
            </form>

            {/* Withdrawal List */}
            <div className="premium-card" style={{ background: 'var(--light-card)', padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>📋 Suivi de vos retraits</h3>
              
              {withdrawalRequests.filter(r => r.userId === currentUser.id).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary-light)', fontSize: '0.85rem' }}>
                  Aucune demande de retrait effectuée.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto' }}>
                  {withdrawalRequests
                    .filter(r => r.userId === currentUser.id)
                    .map(req => {
                      return (
                        <div 
                          key={req.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.85rem',
                            border: '1.5px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'white'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                              {req.amount.toLocaleString('fr-FR')} FCFA
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'capitalize', marginTop: '0.15rem' }}>
                              Par {req.method.replace('_', ' ')} (Tél: {req.phone})
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', marginTop: '0.2rem' }}>
                              Demande du : {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          
                          <span 
                            style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 'bold', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '4px',
                              background: req.status === 'approved' ? 'rgba(0,133,63,0.1)' : req.status === 'rejected' ? 'rgba(217,83,79,0.1)' : 'rgba(252,209,22,0.15)',
                              color: req.status === 'approved' ? 'var(--primary)' : req.status === 'rejected' ? 'var(--danger)' : 'var(--secondary-dark)',
                              border: req.status === 'approved' ? '1px solid rgba(0,133,63,0.2)' : req.status === 'rejected' ? '1px solid rgba(217,83,79,0.2)' : '1px solid rgba(252,209,22,0.3)'
                            }}
                          >
                            {req.status === 'approved' ? 'Validé ✅' : req.status === 'rejected' ? 'Rejeté ❌' : 'En attente ⏳'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div 
          className="premium-card animate-fade-in" 
          style={{ 
            display: 'flex', 
            minHeight: '500px', 
            background: 'var(--light-card)', 
            borderRadius: 'var(--radius-lg)',
            border: '1.5px solid var(--border-light)',
            overflow: 'hidden',
            padding: 0,
            flexDirection: isMobileView ? 'column' : 'row'
          }}
        >
          {/* Left Pane: Thread List */}
          <div 
            style={{ 
              width: isMobileView ? '100%' : '320px', 
              borderRight: isMobileView ? 'none' : '1.5px solid var(--border-light)',
              borderBottom: isMobileView ? '1.5px solid var(--border-light)' : 'none',
              display: (isMobileView && activeChatUserId) ? 'none' : 'flex',
              flexDirection: 'column',
              maxHeight: '550px',
              overflowY: 'auto'
            }}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)', fontWeight: 800, fontSize: '1.1rem', background: 'rgba(0,0,0,0.02)' }}>
              ✉️ Vos Conversations
            </div>
            
            {(() => {
              const chatPartners = usersList.filter(u => {
                if (u.id === currentUser.id) return false;

                // Only allow users with an active follow relationship
                const isFollowing = currentUser.following?.includes(u.id);
                const isFollower = currentUser.followers?.includes(u.id);
                if (!isFollowing && !isFollower) return false;

                return directMessages.some(m => 
                  (m.senderId === currentUser.id && m.receiverId === u.id) ||
                  (m.senderId === u.id && m.receiverId === currentUser.id)
                );
              });

              if (chatPartners.length === 0) {
                return (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary-light)', fontSize: '0.85rem' }}>
                    <p>Aucune discussion en cours.</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Sélectionnez un membre ci-dessous pour lancer une discussion :</p>
                    
                    {/* Suggestions List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', textAlign: 'left' }}>
                      {usersList
                        .filter(u => {
                          if (u.id === currentUser.id) return false;
                          const isFollowing = currentUser.following?.includes(u.id);
                          const isFollower = currentUser.followers?.includes(u.id);
                          return isFollowing || isFollower;
                        })
                        .slice(0, 5)
                        .map(u => (
                          <div 
                            key={u.id}
                            onClick={() => {
                              setActiveChatUserId(u.id);
                              markMessagesAsRead(u.id);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--light)' }}
                          >
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundImage: `url("${u.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{u.name}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {chatPartners.map(u => {
                    const threadMsgs = directMessages.filter(m => 
                      (m.senderId === currentUser.id && m.receiverId === u.id) ||
                      (m.senderId === u.id && m.receiverId === currentUser.id)
                    );
                    const lastMsg = threadMsgs[threadMsgs.length - 1];
                    const unreadCount = directMessages.filter(m => m.senderId === u.id && m.receiverId === currentUser.id && !m.read).length;
                    const isActive = activeChatUserId === u.id;
                    
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setActiveChatUserId(u.id);
                          markMessagesAsRead(u.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '1rem',
                          borderBottom: '1px solid var(--border-light)',
                          cursor: 'pointer',
                          background: isActive ? 'rgba(0,133,63,0.04)' : 'transparent',
                          transition: 'var(--transition-fast)',
                          position: 'relative'
                        }}
                      >
                        <div 
                          style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            backgroundImage: `url("${u.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1.5px solid var(--border-light)'
                          }}
                        >
                          {u.verificationStatus === 'verified' && (
                            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'white', borderRadius: '50%', padding: '1px' }}>
                              <VerifiedRosette size={12} />
                            </div>
                          )}
                        </div>
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {u.name}
                            </span>
                            {lastMsg && (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)' }}>
                                {lastMsg.timestamp}
                              </span>
                            )}
                          </div>
                          {lastMsg && (
                            <p style={{ fontSize: '0.75rem', color: unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary-light)', margin: '0.2rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unreadCount > 0 ? 'bold' : 'normal' }}>
                              {lastMsg.text}
                            </p>
                          )}
                        </div>
                        
                        {unreadCount > 0 && (
                          <span 
                            style={{
                              background: 'var(--danger)',
                              color: 'white',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              padding: '0.15rem 0.35rem',
                              borderRadius: '10px',
                              marginLeft: '0.5rem'
                            }}
                          >
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
          
          {/* Right Pane: Message Area */}
          <div 
            style={{ 
              flex: 1,
              display: (isMobileView && !activeChatUserId) ? 'none' : 'flex',
              flexDirection: 'column',
              maxHeight: '550px',
              minHeight: '380px'
            }}
          >
            {activeChatUserId ? (
              <>
                {/* Chat Header */}
                {(() => {
                  const activeUser = usersList.find(u => u.id === activeChatUserId);
                  if (!activeUser) return null;
                  return (
                    <div 
                      style={{ 
                        padding: '0.75rem 1.25rem', 
                        borderBottom: '1px solid var(--border-light)', 
                        background: 'rgba(0,0,0,0.01)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isMobileView && (
                          <button 
                            type="button" 
                            className="btn btn-ghost" 
                            style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', marginRight: '0.25rem' }} 
                            onClick={() => setActiveChatUserId(null)}
                          >
                            ⬅️
                          </button>
                        )}
                        <div 
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundImage: `url("${activeUser.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1.5px solid var(--primary)'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {activeUser.name}
                            {activeUser.verificationStatus === 'verified' && <VerifiedRosette size={14} />}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>
                            {activeUser.accountType === 'ngo' ? 'ONG' : activeUser.accountType === 'company' ? 'Entreprise' : 'Citoyen'}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--border-light)', minWidth: 'auto' }}
                        onClick={() => setSelectedPublicUserId(activeUser.id)}
                      >
                        Voir Profil
                      </button>
                    </div>
                  );
                })()}
                
                {/* Messages Body */}
                <div 
                  ref={messagesBodyRef}
                  style={{ 
                    flex: 1, 
                    padding: '1.25rem', 
                    overflowY: 'auto', 
                    background: 'rgba(0,0,0,0.01)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  {(() => {
                    const activeChatMessages = directMessages.filter(m => 
                      (m.senderId === currentUser.id && m.receiverId === activeChatUserId) ||
                      (m.senderId === activeChatUserId && m.receiverId === currentUser.id)
                    );

                    return activeChatMessages.map(msg => {
                      const isMe = msg.senderId === currentUser.id;
                      return (
                        <div 
                          key={msg.id}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div 
                            style={{
                              padding: '0.65rem 0.95rem',
                              borderRadius: '16px',
                              borderTopRightRadius: isMe ? '4px' : '16px',
                              borderTopLeftRadius: isMe ? '16px' : '4px',
                              background: isMe ? 'linear-gradient(135deg, var(--primary) 0%, #006b32 100%)' : 'white',
                              color: isMe ? 'white' : 'var(--text-primary)',
                              fontSize: '0.85rem',
                              boxShadow: '0 1.5px 3px rgba(0,0,0,0.05)',
                              border: isMe ? 'none' : '1px solid var(--border-light)',
                              lineHeight: '1.4',
                              wordBreak: 'break-word'
                            }}
                          >
                            {msg.text}
                          </div>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary-light)', marginTop: '0.2rem', padding: '0 0.25rem' }}>
                            {msg.timestamp} {isMe && (msg.read ? '✓✓' : '✓')}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
                
                {/* Messages Footer */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (chatInputText.trim()) {
                      sendDirectMessage(activeChatUserId!, chatInputText.trim());
                      setChatInputText('');
                    }
                  }}
                  style={{ 
                    padding: '0.85rem 1.25rem', 
                    borderTop: '1px solid var(--border-light)', 
                    display: 'flex',
                    gap: '0.75rem',
                    background: 'white'
                  }}
                >
                  <input 
                    type="text"
                    placeholder="Écrire un message..."
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.65rem 1rem',
                      border: '1.5px solid var(--border-light)',
                      borderRadius: '24px',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      borderRadius: '24px',
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.85rem',
                      minWidth: 'auto'
                    }}
                  >
                    Envoyer ➔
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary-light)', padding: '2rem', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>💬</span>
                <strong style={{ display: 'block', marginTop: '1rem', fontSize: '0.95rem' }}>Messagerie Privée</strong>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', maxWidth: '300px', lineHeight: 1.4 }}>
                  Sélectionnez un contact dans la colonne de gauche pour démarrer ou poursuivre une discussion.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bouton de déconnexion au bas de la page */}
      <div style={{ marginTop: '3.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <button 
          className="btn" 
          style={{ 
            padding: '0.75rem 2rem', 
            fontSize: '0.95rem', 
            color: 'var(--text-primary-light)', 
            background: 'transparent', 
            border: '1.5px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'none',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '350px',
            justifyContent: 'center',
            transition: 'var(--transition-fast)'
          }}
          onClick={logout}
        >
          🚪 Se déconnecter
        </button>
      </div>

      {/* Séparateur visuel */}
      <hr style={{ 
        border: 'none', 
        borderTop: '1px solid var(--border-light)', 
        width: '100%', 
        maxWidth: '350px', 
        margin: '2rem auto', 
        opacity: 0.5 
      }} />

      {/* Danger Zone - Supprimer mon compte */}
      <div 
        style={{ 
          marginTop: '1.5rem', 
          marginBottom: '3rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          width: '100%', 
          padding: '1.5rem', 
          border: '1px solid rgba(220, 53, 69, 0.25)', 
          background: 'rgba(220, 53, 69, 0.03)', 
          borderRadius: 'var(--radius-md)', 
          maxWidth: '350px', 
          marginLeft: 'auto', 
          marginRight: 'auto',
          textAlign: 'center'
        }}
      >
        <h4 style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
          ⚠️ {t('profile.danger_zone')}
        </h4>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', lineHeight: 1.4, marginBottom: '1rem' }}>
          La suppression de votre compte est définitive. Toutes vos données personnelles (CNI, selfie, adresse, coordonnées) seront effacées de notre base de données.
        </p>
        <button 
          className="btn" 
          style={{ 
            padding: '0.65rem 1.5rem', 
            fontSize: '0.85rem', 
            color: 'white', 
            background: 'var(--danger)', 
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(220, 53, 69, 0.2)',
            width: '100%'
          }}
          onClick={async () => {
            if (confirm("Êtes-vous absolument sûr de vouloir supprimer définitivement votre compte et toutes vos données personnelles ? Cette action est irréversible.")) {
              const success = await deleteAccount();
              if (success) {
                if (onNavigate) {
                  onNavigate('auth');
                }
              }
            }
          }}
        >
          🗑️ {t('profile.delete_account')}
        </button>
      </div>

      </div>

      {/* 0. AVATAR OPTIONS MODAL */}
      {showAvatarOptions && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: '380px', background: 'var(--light-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', border: '1.5px solid var(--primary)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <strong style={{ fontSize: '1rem', fontWeight: 800 }}>🖼️ Photo de profil</strong>
              <button type="button" className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }} onClick={() => setShowAvatarOptions(false)}>✕</button>
            </div>
            
            {/* Full Photo Preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div 
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  backgroundImage: `url("${editAvatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '4px solid var(--primary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Visualisez votre photo de profil actuelle ou modifiez-la en sélectionnant l'une des options ci-dessous.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.65rem' }}
                onClick={() => {
                  setCameraTarget('avatar');
                  setShowAvatarOptions(false);
                }}
              >
                📷 Prendre en direct (Caméra)
              </button>
              
              <label 
                className="btn btn-outline" 
                style={{ width: '100%', padding: '0.65rem', margin: 0, display: 'block', cursor: 'pointer', textAlign: 'center', boxSizing: 'border-box' }}
              >
                📁 Importer depuis mes fichiers
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1 * 1024 * 1024) {
                        alert("L'image dépasse la limite maximale autorisée de 1 Mo. Veuillez choisir une image plus légère. 🇸🇳");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        compressImage(reader.result as string).then((compressed) => {
                          uploadBase64ToStorage(compressed, 'profiles').then(async (storageUrl) => {
                            setEditAvatar(storageUrl);
                            setShowAvatarOptions(false);
                            if (isDirectUpload && currentUser) {
                              await updateProfile(
                                currentUser.name,
                                currentUser.phone,
                                storageUrl,
                                currentUser.bio || '',
                                currentUser.address || '',
                                currentUser.country,
                                currentUser.region,
                                currentUser.idCardRecto,
                                currentUser.idCardVerso,
                                currentUser.selfie,
                                currentUser.verificationStatus,
                                currentUser.cniNumber,
                                currentUser.dob
                              );
                              addNotification('📸 Photo de profil mise à jour avec succès !');
                            }
                          });
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
              
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ width: '100%', padding: '0.65rem' }}
                onClick={() => setShowAvatarOptions(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. CAMERA OVERLAY MODAL */}
      {cameraTarget && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: '480px', background: 'var(--light-card)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', border: '1.5px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <strong style={{ textTransform: 'capitalize' }}>
                📷 Capture en direct - {cameraTarget === 'selfie' ? 'Selfie de contrôle' : (cameraTarget === 'avatar' ? 'Photo de profil' : `Pièce d'identité (${cameraTarget})`)}
              </strong>
              <button type="button" className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }} onClick={() => setCameraTarget(null)}>✕</button>
            </div>
            
            {cameraError ? (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '1.5rem 0' }}>⚠️ {cameraError}</div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '280px', background: 'black', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <video ref={videoRefCallback} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: (cameraTarget === 'selfie' || cameraTarget === 'avatar') ? 'scaleX(-1)' : 'none' }} />
                <div style={{
                  position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%',
                  border: '2px dashed rgba(255,255,255,0.5)', borderRadius: (cameraTarget === 'selfie' || cameraTarget === 'avatar') ? '50%' : '8px',
                  pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem'
                }}>
                  {(cameraTarget === 'selfie' || cameraTarget === 'avatar') ? 'Cadrez votre visage' : 'Cadrez le document'}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCameraTarget(null)}>Annuler</button>
              {!cameraError && (
                <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={capturePhoto}>
                  📸 Capturer la photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. KYC VERIFICATION PROCESS MODAL */}
      {isVerifying && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--light-card)', borderRadius: 'var(--radius-lg)', padding: '2.5rem 2rem', textAlign: 'center', border: `2px solid ${verificationStep === 'failed' ? 'var(--danger)' : 'var(--secondary)'}`, boxShadow: 'var(--shadow-lg)' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', animation: verificationStep === 'failed' ? 'none' : 'float 2s infinite' }}>
              {verificationStep === 'scan' ? '🔍' : verificationStep === 'ocr' ? '🗂️' : verificationStep === 'face' ? '📂' : verificationStep === 'failed' ? '❌' : '🎉'}
            </span>
            
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '1rem', marginBottom: '0.5rem', color: verificationStep === 'failed' ? 'var(--danger)' : 'inherit' }}>
              {verificationStep === 'scan' && "Vérification des pièces..."}
              {verificationStep === 'ocr' && "Lecture des données (NIN, DOB)..."}
              {verificationStep === 'face' && "Préparation du dossier..."}
              {verificationStep === 'failed' && "Échec de la Vérification"}
              {verificationStep === 'success' && "Dossier KYC Soumis !"}
            </h3>
            
            <p style={{ fontSize: '0.825rem', color: verificationStep === 'failed' ? 'var(--danger)' : 'var(--text-secondary-light)', marginBottom: '1.5rem', lineHeight: 1.4, fontWeight: verificationStep === 'failed' ? '500' : 'normal' }}>
              {verificationStep === 'scan' && "Traitement en cours des photos de votre carte d'identité."}
              {verificationStep === 'ocr' && "Lecture automatique des informations d'identité (CNI / NIN)."}
              {verificationStep === 'face' && "Finalisation et signature de votre dossier pour validation."}
              {verificationStep === 'failed' && verificationError}
              {verificationStep === 'success' && "Votre configuration pour votre clé KYC est en cours. Un administrateur examine vos pièces d'identité (CNI & selfie) pour valider votre profil."}
            </p>
            
            {verificationStep !== 'failed' && (
              <>
                <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                  <div style={{ width: `${verificationProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
                
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '2rem' }}>
                  {verificationProgress}% complété
                </div>
              </>
            )}
            
            {verificationStep === 'success' && (
              <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setIsVerifying(false); setVerificationStep('none'); setIsEditingKyc(false); }}>
                Terminer & Continuer ➔
              </button>
            )}

            {verificationStep === 'failed' && (
              <button type="button" className="btn btn-danger" style={{ width: '100%', background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => { setIsVerifying(false); setVerificationStep('none'); setVerificationError(null); }}>
                Fermer & Corriger ➔
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
