import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BadgeList } from '../components/BadgeList';
import { TrustScore } from '../components/TrustScore';

interface ProfileProps {
  onNavigate?: (page: string, params?: any) => void;
  initialParams?: any;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate, initialParams }) => {
  const { currentUser, petitions, cagnottes, volunteerApplications, logout, updateProfile, addNotification } = useApp();

  const [isEditing, setIsEditing] = useState(false);
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

  // Camera Overlay and Biometric Simulation states
  const [cameraTarget, setCameraTarget] = useState<'recto' | 'verso' | 'selfie' | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'scan' | 'ocr' | 'face' | 'success' | 'none'>('none');
  const [verificationProgress, setVerificationProgress] = useState(0);

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

  // Camera capture methods
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: cameraTarget === 'selfie' ? 'user' : 'environment' } 
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
    return () => stopCamera();
  }, [cameraTarget]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (cameraTarget === 'selfie') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg');
        if (cameraTarget === 'recto') setEditIdRecto(base64);
        else if (cameraTarget === 'verso') setEditIdVerso(base64);
        else if (cameraTarget === 'selfie') setEditSelfie(base64);
        
        setCameraTarget(null);
        addNotification("📷 Capture photo réussie !");
      }
    }
  };

  // Biometric validation simulation
  const runBiometricVerification = () => {
    if (!editCniNumber || editCniNumber.trim().length < 5) {
      alert("Veuillez saisir un numéro de CNI valide.");
      return;
    }
    if (!editDob || editDob.trim().length < 6) {
      alert("Veuillez saisir votre date de naissance.");
      return;
    }
    if (!editIdRecto || !editIdVerso) {
      alert("Veuillez téléverser ou prendre en photo la pièce d'identité (Recto & Verso).");
      return;
    }
    if (!editSelfie) {
      alert("Veuillez téléverser ou prendre un selfie de contrôle.");
      return;
    }

    setIsVerifying(true);
    setVerificationStep('scan');
    setVerificationProgress(15);

    setTimeout(() => {
      setVerificationProgress(45);
      setVerificationStep('ocr');
    }, 2000);

    setTimeout(() => {
      setVerificationProgress(75);
      setVerificationStep('face');
    }, 4000);

    setTimeout(() => {
      setVerificationProgress(100);
      setVerificationStep('success');
      setEditVerificationStatus('verified');
      
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
        'verified',
        editCniNumber,
        editDob
      ).then(() => {
        addNotification("✅ Identité vérifiée et certifiée !");
      });
      
    }, 6500);
  };

  useEffect(() => {
    if (editCountry !== 'Sénégal') {
      setEditRegion('Diaspora');
    }
  }, [editCountry]);

  useEffect(() => {
    if (initialParams?.requireCompletion) {
      setIsEditing(true);
      addNotification("Veuillez compléter vos informations d'identification obligatoires.");
    }
  }, [initialParams]);

  const getMissingFields = () => {
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
    if (!currentUser.cniNumber || !currentUser.cniNumber.trim()) missing.push("Numéro de CNI / Passeport");
    if (!currentUser.dob || !currentUser.dob.trim()) missing.push("Date de naissance");
    if (!currentUser.idCardRecto || !currentUser.idCardRecto.trim()) missing.push("Pièce d'identité (Recto)");
    if (!currentUser.idCardVerso || !currentUser.idCardVerso.trim()) missing.push("Pièce d'identité (Verso)");
    if (!currentUser.selfie || !currentUser.selfie.trim()) missing.push("Selfie de contrôle");
    if (currentUser.verificationStatus !== 'verified') missing.push("Vérification biométrique d'identité");
    
    return missing;
  };

  const missingFields = getMissingFields();
  const isProfileIncomplete = missingFields.length > 0;

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
    p.signers.some(s => s.name.toLowerCase() === currentUser.name.toLowerCase())
  ).length;

  const userDonations = cagnottes.reduce((list: any[], c) => {
    const matchingDons = c.donors.filter(d => d.name.toLowerCase() === currentUser.name.toLowerCase());
    matchingDons.forEach(d => {
      list.push({ cagnotteTitle: c.title, amount: d.amount, date: d.date });
    });
    return list;
  }, []);

  const totalDonated = userDonations.reduce((sum, d) => sum + d.amount, 0);

  const appliedMissionsCount = volunteerApplications.filter(a => 
    a.userName.toLowerCase() === currentUser.name.toLowerCase()
  ).length;

  const handleUpdateSubmit = async (e: React.FormEvent) => {
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
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in animate-slide-up" style={{ paddingBottom: '3rem' }}>
      {/* WARNING BANNER FOR INCOMPLETE PROFILE */}
      {isProfileIncomplete && (
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
              Profil Incomplet - Sécurité & Transparence Obligatoires
            </strong>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: 0, lineHeight: '1.4' }}>
            Pour garantir la transparence des cagnottes, la légitimité des pétitions et la sécurité des tontines, Sama Cause requiert que chaque utilisateur soit formellement identifié. Veuillez renseigner les informations obligatoires suivantes dans votre profil :
          </p>
          <ul style={{ fontSize: '0.85rem', color: 'var(--danger)', margin: '0.25rem 0 0 1.25rem', padding: 0, fontWeight: 600 }}>
            {missingFields.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {initialParams?.requireCompletion && (
            <div style={{ marginTop: '0.5rem', background: 'rgba(217, 83, 79, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger)' }}>
              🔒 Vous devez obligatoirement compléter votre profil pour pouvoir lancer ou participer à des pétitions, des cagnottes ou des tontines.
            </div>
          )}
        </div>
      )}

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
          onClick={() => document.getElementById('avatar-direct-upload')?.click()}
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
            justifyContent: 'center',
            overflow: 'hidden'
          }} 
          title="Cliquez pour changer directement votre photo de profil"
        >
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
            📷
          </div>
        </div>
        
        <input
          id="avatar-direct-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = async () => {
                const base64 = reader.result as string;
                await updateProfile(
                  currentUser.name,
                  currentUser.phone,
                  base64,
                  currentUser.bio || '',
                  currentUser.address || ''
                );
                addNotification('📸 Photo de profil mise à jour avec succès !');
              };
              reader.readAsDataURL(file);
            }
          }}
        />

        <div style={{ flex: 1, minWidth: '250px' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
              {currentUser.name} {currentUser.verified && '✓'}
            </h2>
            <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
              👤 {currentUser.role === 'admin' ? 'Administrateur 🛡️' : `Citoyen ${currentUser.role}`}
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

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <TrustScore score={currentUser.trustScore} />
            {currentUser.verificationStatus === 'verified' ? (
              <span style={{ fontSize: '0.75rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(0,133,63,0.2)' }}>
                🛡️ Identité Certifiée
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', background: 'rgba(217,83,79,0.1)', color: 'var(--danger)', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(217,83,79,0.2)' }}>
                ⚠️ Non vérifié (KYC requis)
              </span>
            )}
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '✕ Fermer' : '✏️ Compléter / Éditer le profil'}
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}
              onClick={logout}
            >
              🚪 Se déconnecter
            </button>
          </div>
        </div>

        {/* Stats Summary Panel */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{signedPetitionsCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>Pétitions Signées</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{totalDonated.toLocaleString('fr-FR')} F</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>Fonds Donnés</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-light)', paddingLeft: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{appliedMissionsCount}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>Bénévolats</div>
          </div>
        </div>
      </div>

      {/* EDITING FORM */}
      {isEditing && (
        <form 
          onSubmit={handleUpdateSubmit} 
          className="premium-card animate-fade-in" 
          style={{ marginBottom: '2.5rem', background: 'var(--light-card)', padding: '2rem' }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Compléter mon profil Sama Cause</h3>
          
          <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Prénom & Nom</label>
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Téléphone Mobile</label>
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

          <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Photo de profil</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => document.getElementById('avatar-file-upload')?.click()}
                  style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', width: '100%' }}
                >
                  📁 Choisir un fichier...
                </button>
                <input
                  id="avatar-file-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Pays de résidence</label>
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Région d'impact</label>
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Choisir une photo de profil par défaut</label>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {[
                { name: 'Fatou', url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&fit=crop&q=80' },
                { name: 'Amady', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80' },
                { name: 'Mouhameth', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&fit=crop&q=80' },
                { name: 'Awa', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&fit=crop&q=80' }
              ].map((av, idx) => (
                <div 
                  key={idx}
                  onClick={() => setEditAvatar(av.url)}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundImage: `url(${av.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    border: editAvatar === av.url ? '3px solid var(--primary)' : '1px solid var(--border-light)',
                    transform: editAvatar === av.url ? 'scale(1.1)' : 'none',
                    transition: 'var(--transition-fast)'
                  }}
                  title={av.name}
                />
              ))}
            </div>
          </div>

          {/* ID Verification Sub-section */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🛡️ Vérification d'Identité Citoyenne (Obligatoire)
            </h4>
            
            <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Numéro de Carte d'Identité (CNI) ou Passeport</label>
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
                <strong style={{ fontSize: '0.8rem', display: 'block' }}>🪪 Pièce d'identité (Recto)</strong>
                {editIdRecto ? (
                  <div style={{ height: '90px', backgroundImage: `url(${editIdRecto})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
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
                        const reader = new FileReader();
                        reader.onloadend = () => setEditIdRecto(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>

              {/* Verso */}
              <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', background: 'var(--light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'space-between', border: editIdVerso ? '1px solid var(--primary)' : '1px dashed var(--border-light)' }}>
                <strong style={{ fontSize: '0.8rem', display: 'block' }}>🪪 Pièce d'identité (Verso)</strong>
                {editIdVerso ? (
                  <div style={{ height: '90px', backgroundImage: `url(${editIdVerso})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
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
                        const reader = new FileReader();
                        reader.onloadend = () => setEditIdVerso(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>
              </div>

              {/* Selfie */}
              <div className="premium-card" style={{ padding: '1rem', textAlign: 'center', background: 'var(--light)', display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'space-between', border: editSelfie ? '1px solid var(--primary)' : '1px dashed var(--border-light)' }}>
                <strong style={{ fontSize: '0.8rem', display: 'block' }}>🤳 Selfie de contrôle</strong>
                {editSelfie ? (
                  <div style={{ height: '90px', backgroundImage: `url(${editSelfie})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '4px', border: '1px solid var(--border-light)' }} />
                ) : (
                  <div style={{ height: '90px', background: 'var(--light-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-secondary-light)', borderRadius: '4px' }}>👤</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%' }} onClick={() => setCameraTarget('selfie')}>
                    📸 Prendre en direct
                  </button>
                  <label className="btn btn-ghost" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', width: '100%', margin: 0, display: 'inline-block', cursor: 'pointer', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                    📁 Importer...
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setEditSelfie(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
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
                🧠 Lancer la vérification biométrique & certifier mon identité
              </button>
            ) : (
              <div style={{ background: 'rgba(0,133,63,0.08)', border: '1px solid var(--primary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
                🛡️ Votre identité est certifiée et vérifiée en toute sécurité.
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Votre Bio / Engagement Citoyen</label>
            <textarea
              placeholder="Ex : Citoyen engagé pour le reboisement et la solidarité nationale."
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
              onClick={() => setIsEditing(false)}
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

      {/* GAMIFICATION & BADGES */}
      <section style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>🏅 Badges Citoyens</h3>
        <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem' }}>
          Réalisez des actions de mobilisation pour débloquer de nouveaux badges et augmenter votre indice de score de confiance.
        </p>
        <BadgeList unlockedBadgeIds={currentUser.badges} />
      </section>

      {/* MY CAMPAIGNS & Doléances */}
      <section style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>📣 Mes Doléances & Cagnottes Lancées</h3>

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
                .filter(p => p.signers.some(s => s.name.toLowerCase() === currentUser.name.toLowerCase()))
                .map(p => {
                  const mySig = p.signers.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase());
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
                .filter(a => a.userName.toLowerCase() === currentUser.name.toLowerCase())
                .map(app => {
                  return (
                    <div key={`app-${app.id}`} className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', background: 'var(--light-card)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--info)', fontWeight: 'bold' }}>🛠️ ENGAGEMENT BÉNÉVOLE</span>
                        <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: '0.15rem 0' }}>Candidature envoyée</h4>
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
                📷 Capture en direct - {cameraTarget === 'selfie' ? 'Selfie de contrôle' : `Pièce d'identité (${cameraTarget})`}
              </strong>
              <button type="button" className="btn btn-ghost" style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }} onClick={() => setCameraTarget(null)}>✕</button>
            </div>
            
            {cameraError ? (
              <div style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '1.5rem 0' }}>⚠️ {cameraError}</div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '280px', background: 'black', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: cameraTarget === 'selfie' ? 'scaleX(-1)' : 'none' }} />
                <div style={{
                  position: 'absolute', top: '10%', left: '10%', width: '80%', height: '80%',
                  border: '2px dashed rgba(255,255,255,0.5)', borderRadius: cameraTarget === 'selfie' ? '50%' : '8px',
                  pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem'
                }}>
                  {cameraTarget === 'selfie' ? 'Cadrez votre visage' : 'Cadrez le document'}
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

      {/* 2. BIOMETRIC VERIFICATION PROCESS MODAL */}
      {isVerifying && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          zIndex: 1600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="glass animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--light-card)', borderRadius: 'var(--radius-lg)', padding: '2.5rem 2rem', textAlign: 'center', border: '2px solid var(--secondary)', boxShadow: 'var(--shadow-lg)' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', animation: 'float 2s infinite' }}>
              {verificationStep === 'scan' ? '🔍' : verificationStep === 'ocr' ? '🗂️' : verificationStep === 'face' ? '🧠' : '🎉'}
            </span>
            
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
              {verificationStep === 'scan' && "Numérisation des pièces..."}
              {verificationStep === 'ocr' && "Extraction des données (OCR)..."}
              {verificationStep === 'face' && "Comparaison Faciale Biométrique..."}
              {verificationStep === 'success' && "Certification d'Identité Réussie !"}
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              {verificationStep === 'scan' && "Vérification de l'intégrité des photos de votre carte d'identité."}
              {verificationStep === 'ocr' && "Lecture des caractères textuels et du numéro de CNI."}
              {verificationStep === 'face' && "Comparaison biométrique des repères faciaux de la CNI et de votre selfie."}
              {verificationStep === 'success' && "Félicitations ! Les photos correspondent à 98.4%. Votre profil citoyen est certifié."}
            </p>
            
            <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ width: `${verificationProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
            
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '2rem' }}>
              {verificationProgress}% complété
            </div>
            
            {verificationStep === 'success' && (
              <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setIsVerifying(false); setVerificationStep('none'); }}>
                Terminer & Continuer ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
