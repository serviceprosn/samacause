import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Petition } from '../types';
import { TrustScore } from '../components/TrustScore';
import { useSEO } from '../hooks/useSEO';

interface PetitionsProps {
  initialPetitionId?: string;
  initialView?: 'list' | 'detail' | 'create' | 'tracking';
  initialAction?: string;
  onNavigate: (page: string, params?: any) => void;
  aiAppliedData?: any;
  setAiAppliedData?: (data: any) => void;
}

export const Petitions: React.FC<PetitionsProps> = ({ initialPetitionId, initialView, initialAction, onNavigate, aiAppliedData, setAiAppliedData }) => {
  const { 
    petitions, 
    createPetition, 
    signPetition, 
    boostPetition,
    currentUser, 
    sendOtpSms, 
    verifyOtp,
    addCampaignUpdate,
    activeOtpCode,
    addNotification,
    resubmitCampaign,
    isProfileComplete,
    setSelectedPublicUserId,
    usersList
  } = useApp();

  // Auto-fill from AI Assistant
  React.useEffect(() => {
    if (aiAppliedData && aiAppliedData.title) {
      setTitle(aiAppliedData.title);
      setDescription(aiAppliedData.description + (aiAppliedData.petitionText ? `\n\n[Texte de la pétition]\n${aiAppliedData.petitionText}` : ''));
      setActiveView('create');
      if (setAiAppliedData) {
        setAiAppliedData(null);
      }
    }
  }, [aiAppliedData, setAiAppliedData]);



  const [activeView, setActiveView] = useState<'list' | 'detail' | 'create' | 'tracking'>(
    initialView || (initialPetitionId ? 'detail' : 'list')
  );
  
  const [selectedPetitionId, setSelectedPetitionId] = useState<string | null>(
    initialPetitionId || null
  );

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState<'sante' | 'education' | 'infrastructure' | 'environnement' | 'social'>('sante');
  const [signaturesTarget, setSignaturesTarget] = useState(1000);
  const [location, setLocation] = useState('Dakar');
  const [dateLimit, setDateLimit] = useState('');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80');

  // Signature Form State
  const [showSignModal, setShowSignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);

  // Boost States
  const [boostStep, setBoostStep] = useState<'package' | 'method' | 'details' | 'success'>('package');
  const [selectedPack, setSelectedPack] = useState<'ndamel' | 'teranga' | 'lion'>('ndamel');
  const [boostMethod, setBoostMethod] = useState<'wave' | 'om' | 'free' | 'card'>('wave');
  const [boostPhone, setBoostPhone] = useState(currentUser?.phone || '');
  const [boostCardName, setBoostCardName] = useState(currentUser?.name || '');
  const [boostCardNumber, setBoostCardNumber] = useState('');
  const [boostCardExpiry, setBoostCardExpiry] = useState('');
  const [boostCardCvv, setBoostCardCvv] = useState('');
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostTxRef, setBoostTxRef] = useState('');

  const [signName, setSignName] = useState('');
  const [signEmail, setSignEmail] = useState('');
  const [signPhone, setSignPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'form' | 'otp'>('form');

  // Sync user info and handle initial trigger actions
  React.useEffect(() => {
    if (currentUser) {
      setSignName(currentUser.name || '');
      setSignEmail(currentUser.email || '');
      setSignPhone(currentUser.phone || '');
      setBoostPhone(currentUser.phone || '');
      setBoostCardName(currentUser.name || '');
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (currentUser && initialPetitionId && initialAction === 'sign') {
      setShowSignModal(true);
    }
    if (currentUser && initialPetitionId && initialAction === 'boost') {
      setShowBoostModal(true);
    }
  }, [currentUser, initialPetitionId, initialAction]);

  // Update post Form State
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');

  // Find active petition
  const currentPetition = petitions.find(p => p.id === selectedPetitionId);

  // Dynamic SEO management
  const seoTitle = activeView === 'detail' && currentPetition 
    ? `Pétition : ${currentPetition.title}` 
    : activeView === 'create' 
      ? 'Lancer une pétition' 
      : 'Pétitions Citoyennes';
  
  const seoDesc = activeView === 'detail' && currentPetition 
    ? currentPetition.description.slice(0, 160) + (currentPetition.description.length > 160 ? '...' : '')
    : activeView === 'create'
      ? 'Lancez votre pétition citoyenne sur Sunu Yité et mobilisez la communauté pour le changement au Sénégal.'
      : 'Découvrez et signez les pétitions citoyennes en cours au Sénégal pour faire entendre votre voix.';

  const seoImage = activeView === 'detail' && currentPetition ? currentPetition.coverImage : undefined;

  useSEO({
    title: seoTitle,
    description: seoDesc,
    ogImage: seoImage,
    keywords: 'Sénégal, pétition, doléance, changement, citoyen, signature, impact, cause'
  });

  // States for petition correction
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editRecipient, setEditRecipient] = useState('');
  const [editLocation, setEditLocation] = useState('Dakar');
  const [editSignaturesTarget, setEditSignaturesTarget] = useState(1000);
  const [editCoverImage, setEditCoverImage] = useState('');

  React.useEffect(() => {
    if (currentPetition && currentPetition.status === 'rejected') {
      setEditTitle(currentPetition.title);
      setEditDescription(currentPetition.description);
      setEditRecipient(currentPetition.recipient);
      setEditLocation(currentPetition.location);
      setEditSignaturesTarget(currentPetition.signaturesTarget);
      setEditCoverImage(currentPetition.coverImage);
    }
  }, [selectedPetitionId, currentPetition?.status, currentPetition]);

  // Filters & Sorting
  const filteredPetitions = petitions
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                            p.recipient.toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      const isActive = p.status === 'active';
      return matchesSearch && matchesCat && isActive;
    })
    .sort((a, b) => {
      const aBoost = a.boosted ? 1 : 0;
      const bBoost = b.boosted ? 1 : 0;
      return bBoost - aBoost;
    });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = createPetition({
      title,
      description,
      recipient,
      category,
      signaturesTarget,
      location,
      dateLimit,
      coverImage
    });
    // Reset
    setTitle('');
    setDescription('');
    setRecipient('');
    setLocation('');
    setDateLimit('');
    if (newId) {
      setSelectedPetitionId(newId);
      setActiveView('tracking');
    } else {
      setActiveView('list');
    }
  };

  const handleSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signPhone) {
      alert('Veuillez entrer un numéro de téléphone');
      return;
    }
    // Simulate SMS dispatch
    sendOtpSms(signPhone);
    setOtpStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOtp(otpCode)) {
      if (selectedPetitionId) {
        signPetition(selectedPetitionId, signName, signEmail, signPhone);
      }
      setShowSignModal(false);
      setOtpStep('form');
      setOtpCode('');
    } else {
      alert("Code OTP incorrect. Veuillez réessayer.");
    }
  };

  const handlePostUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPetitionId && updateTitle && updateContent) {
      addCampaignUpdate(selectedPetitionId, 'petition', updateTitle, updateContent);
      setUpdateTitle('');
      setUpdateContent('');
      setShowUpdateForm(false);
    }
  };

  // Helper for applying AI generated outputs
  const handleApplyAITemplates = (data: { title: string; description: string; petitionText?: string }) => {
    setTitle(data.title);
    setDescription(data.description);
    if (data.petitionText) {
      setDescription(prev => `${prev}\n\n[Texte de la pétition]\n${data.petitionText}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Pétitions Citoyennes</h1>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.9rem' }}>Faites entendre votre voix et lancez des alertes.</p>
        </div>
        <div>
          {activeView === 'list' && (
            <button className="btn btn-primary" onClick={() => {
              if (currentUser) {
                if (!isProfileComplete(currentUser)) {
                  addNotification("🔒 Profil incomplet. Renseignez vos informations d'identification pour la sécurité.");
                  onNavigate('profile', { requireCompletion: true });
                } else {
                  setActiveView('create');
                }
              } else {
                onNavigate('auth', { redirectPage: 'petitions', redirectView: 'create' });
              }
            }}>
              ✍️ Lancer une pétition
            </button>
          )}
          {activeView !== 'list' && (
            <button className="btn btn-outline" onClick={() => { setActiveView('list'); setSelectedPetitionId(null); }}>
              🗂️ Revenir au flux
            </button>
          )}
        </div>
      </div>

      {/* 1. LIST VIEW */}
      {activeView === 'list' && (
        <div>
          {/* SEARCH & TABS */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="premium-card"
              placeholder="Rechercher une pétition, un destinataire..."
              style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--light-card)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {['all', 'sante', 'education', 'infrastructure', 'environnement', 'social'].map((cat) => (
                <button
                  key={cat}
                  className="btn"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: categoryFilter === cat ? 'var(--primary)' : 'var(--light-card)',
                    color: categoryFilter === cat ? 'white' : 'var(--text-primary-light)',
                    border: '1px solid var(--border-light)',
                    textTransform: 'capitalize'
                  }}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat === 'all' ? 'Tous' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* PETITIONS FEED */}
          {filteredPetitions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--light-card)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontWeight: 600 }}>Aucune pétition trouvée.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
                Soyez le premier à lancer une pétition citoyenne pour cette catégorie !
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredPetitions.map((pet) => {
                const percent = Math.min(100, Math.round((pet.signaturesCount / pet.signaturesTarget) * 100));
                return (
                  <div 
                    key={pet.id} 
                    className="premium-card responsive-card-layout hover-scale"
                    style={{ 
                      padding: '1.25rem'
                    }}
                  >
                    <div 
                      style={{ 
                        height: '160px', 
                        borderRadius: 'var(--radius-md)', 
                        backgroundImage: `url(${pet.coverImage})`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} 
                    />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(0,133,63,0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                              {pet.category}
                            </span>
                            {pet.boosted && (
                              <span 
                                className="animate-pulse" 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  color: '#111', 
                                  fontWeight: 'extrabold', 
                                  textTransform: 'uppercase', 
                                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
                                  padding: '0.25rem 0.5rem', 
                                  borderRadius: '4px',
                                  boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
                                }}
                              >
                                🚀 BOOSTÉ
                              </span>
                            )}
                          </div>
                          <TrustScore score={pet.organizer.trustScore} />
                        </div>
                        <h3 
                          style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem', cursor: 'pointer' }}
                          onClick={() => { setSelectedPetitionId(pet.id); setActiveView('detail'); }}
                        >
                          {pet.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: '0.25rem' }}>
                          {pet.description}
                        </p>
                      </div>

                      <div>
                        {/* Progress Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span><strong>{pet.signaturesCount.toLocaleString('fr-FR')}</strong> signatures</span>
                          <span style={{ color: 'var(--text-secondary-light)' }}>Objectif : {pet.signaturesTarget.toLocaleString('fr-FR')}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                            Destinataire : <strong>{pet.recipient}</strong>
                          </span>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                            onClick={() => { setSelectedPetitionId(pet.id); setActiveView('detail'); }}
                          >
                            Voir la cause ➔
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. DETAIL VIEW */}
      {activeView === 'detail' && currentPetition && (
        <div className="responsive-grid-main-sidebar">
          {/* Main Content */}
          <div>
            <div 
              style={{ 
                height: '320px', 
                borderRadius: 'var(--radius-lg)', 
                backgroundImage: `url(${currentPetition.coverImage})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-light)'
              }} 
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  ✍️ Pétition
                </span>
                {currentPetition.boosted && (
                  <span 
                    style={{ 
                      fontSize: '0.8rem', 
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', 
                      color: '#111', 
                      padding: '0.25rem 0.6rem', 
                      borderRadius: '4px', 
                      fontWeight: 'extrabold', 
                      textTransform: 'uppercase',
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                    }}
                  >
                    🚀 Cause Boostée ({currentPetition.boostLevel === 'lion' ? 'National' : currentPetition.boostLevel === 'teranga' ? 'Prioritaire' : 'Régional'})
                  </span>
                )}
              </div>
              <TrustScore score={currentPetition.organizer.trustScore} />
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>{currentPetition.title}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
              Destinataire administratif : <strong style={{ color: 'var(--text-primary-light)' }}>{currentPetition.recipient}</strong> | Localisation : <strong>{currentPetition.location}</strong>
            </p>

            {/* Description Tabbed Area */}
            <div className="premium-card" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                Lettre de doléances
              </h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{currentPetition.description}</p>
            </div>

            {/* Timeline updates */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📢 Actualités du Projet ({currentPetition.updates.length})</h3>
                {currentUser && currentUser.id === currentPetition.organizer.id && (
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => setShowUpdateForm(!showUpdateForm)}
                  >
                    {showUpdateForm ? 'Annuler' : 'Publier une actualité'}
                  </button>
                )}
              </div>

              {showUpdateForm && (
                <form onSubmit={handlePostUpdateSubmit} className="premium-card" style={{ marginBottom: '1.5rem', background: 'var(--light)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input 
                      type="text" 
                      required 
                      className="premium-card" 
                      placeholder="Titre de l'actualité" 
                      style={{ padding: '0.5rem 0.75rem', background: 'white' }}
                      value={updateTitle}
                      onChange={(e) => setUpdateTitle(e.target.value)}
                    />
                    <textarea 
                      required 
                      rows={3} 
                      className="premium-card" 
                      placeholder="Contenu..." 
                      style={{ padding: '0.5rem 0.75rem', background: 'white', resize: 'none' }}
                      value={updateContent}
                      onChange={(e) => setUpdateContent(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
                      Publier
                    </button>
                  </div>
                </form>
              )}

              {currentPetition.updates.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', fontStyle: 'italic' }}>
                  Aucune mise à jour publiée pour le moment.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {currentPetition.updates.map((upd) => (
                    <div key={upd.id} className="premium-card" style={{ background: 'var(--light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary-light)', marginBottom: '0.35rem' }}>
                        <span>Par <strong>{upd.author}</strong></span>
                        <span>{upd.date}</span>
                      </div>
                      <h4 style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{upd.title}</h4>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{upd.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signers list */}
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>✍️ Signataires Récents ({currentPetition.signers.length})</h3>
              <div 
                className="premium-card" 
                style={{ 
                  maxHeight: '220px', 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.6rem' 
                }}
              >
                {currentPetition.signers.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary-light)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    Soyez le premier citoyen à signer cette pétition !
                  </p>
                ) : (
                  currentPetition.signers.map((sig, idx) => {
                    const signerMatch = usersList.find(u => u.name && sig.name && u.name.toLowerCase() === sig.name.toLowerCase());
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          fontSize: '0.85rem', 
                          borderBottom: '1px solid var(--border-light)',
                          paddingBottom: '0.4rem' 
                        }}
                      >
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            cursor: signerMatch ? 'pointer' : 'default'
                          }}
                          onClick={() => {
                            if (signerMatch) {
                              setSelectedPublicUserId(signerMatch.id);
                            }
                          }}
                          title={signerMatch ? "Voir le profil de ce citoyen" : undefined}
                        >
                          <span>👤</span>
                          <strong style={{ color: signerMatch ? 'var(--primary)' : 'inherit', textDecoration: signerMatch ? 'underline' : 'none' }}>
                            {sig.name}
                          </strong>
                          {sig.badge && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              {sig.badge}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{sig.date}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Action Sidebar */}
          <div>
            <div className="premium-card" style={{ position: 'sticky', top: '2rem', border: '1.5px solid var(--primary)', background: 'var(--light-card)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>Signer la pétition</h3>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <strong>{currentPetition.signaturesCount.toLocaleString('fr-FR')} signatures</strong>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Cible : {currentPetition.signaturesTarget}</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--border-light)', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${Math.min(100, Math.round((currentPetition.signaturesCount / currentPetition.signaturesTarget) * 100))}%`, height: '100%', background: 'var(--primary)', borderRadius: '5px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                  Progression : <strong>{Math.round((currentPetition.signaturesCount / currentPetition.signaturesTarget) * 100)}%</strong> de l'objectif
                </span>
              </div>

              {/* Organizer widget */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  borderTop: '1px solid var(--border-light)', 
                  borderBottom: '1px solid var(--border-light)', 
                  padding: '0.75rem 0',
                  marginBottom: '1.25rem',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedPublicUserId(currentPetition.organizer.id)}
                title="Voir le profil de l'organisateur"
              >
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundImage: `url(${currentPetition.organizer.avatar})`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center' 
                  }} 
                />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Lancé par</div>
                  <strong style={{ fontSize: '0.85rem' }}>{currentPetition.organizer.name}</strong>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={() => {
                if (currentUser) {
                  setShowSignModal(true);
                } else {
                  onNavigate('auth', { redirectPage: 'petitions', redirectId: currentPetition.id, triggerAction: 'sign' });
                }
              }}>
                ✍️ Signer cette cause
              </button>

              <button 
                className="btn btn-outline" 
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
                onClick={() => setShowShareModal(true)}
              >
                📢 Partager la cause
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ 
                  width: '100%', 
                  padding: '0.85rem', 
                  marginTop: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  color: '#111',
                  border: 'none',
                  fontWeight: 'bold'
                }} 
                onClick={() => {
                  if (currentUser) {
                    setShowBoostModal(true);
                    setBoostStep('package');
                  } else {
                    onNavigate('auth', { redirectPage: 'petitions', redirectId: currentPetition.id, triggerAction: 'boost' });
                  }
                }}
              >
                🚀 Booster cette cause
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>
                  🔒 Signature sécurisée par vérification OTP mobile SMS.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE VIEW */}
      {activeView === 'create' && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(0,133,63,0.04)', border: '1px dashed var(--primary)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div style={{ fontSize: '0.8rem' }}>
              <strong>Besoin d'aide pour rédiger ?</strong> Ouvrez l'<strong>Assistant IA</strong> dans le header pour générer des textes percutants et les insérer en 1 clic.
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="premium-card">
            <h3 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Nouvelle Pétition Citoyenne</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Titre de la pétition</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Réfection de la maternité de Kolda"
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid-cols-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Catégorie</label>
                  <select
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                  >
                    <option value="sante">Santé & Action Sociale</option>
                    <option value="education">Éducation & Enfance</option>
                    <option value="infrastructure">Infrastructure & Transport</option>
                    <option value="environnement">Environnement & Écologie</option>
                    <option value="social">Solidarité & Social</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Région d'impact au Sénégal</label>
                  <select
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
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
                  </select>
                </div>
              </div>

              <div className="grid-cols-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Destinataire administratif</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : Monsieur le Ministre de la Santé"
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Objectif de signatures</label>
                  <input
                    type="number"
                    required
                    min={100}
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={signaturesTarget}
                    onChange={(e) => setSignaturesTarget(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Date Limite de signature</label>
                  <input
                    type="date"
                    required
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={dateLimit}
                    onChange={(e) => setDateLimit(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Importer une image de couverture</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => document.getElementById('petition-cover-upload')?.click()}
                      style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', width: '100%' }}
                    >
                      📁 Choisir un fichier...
                    </button>
                    <input
                      id="petition-cover-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCoverImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {coverImage && (
                      <div 
                        style={{
                          width: '60px',
                          height: '40px',
                          borderRadius: '6px',
                          backgroundImage: `url(${coverImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid var(--border-light)',
                          flexShrink: 0
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Description & Arguments (Lettre)</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Décrivez les arguments soutenant votre démarche citoyenne..."
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', resize: 'none' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setActiveView('list')}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Soumettre la pétition
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 4. TRACKING VIEW */}
      {activeView === 'tracking' && (
        <div className="animate-fade-in" style={{ maxWidth: '750px', margin: '0 auto', paddingBottom: '3rem' }}>
          {/* Confirmation Header */}
          <div 
            className="premium-card" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(0, 133, 63, 0.05) 0%, rgba(252, 209, 22, 0.05) 100%)', 
              border: '2px solid var(--primary)', 
              textAlign: 'center', 
              padding: '2rem', 
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem'
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              Félicitations ! Votre demande a été envoyée avec succès
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary-light)', marginTop: '0.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              L'équipe de Sunu Yité étudiera votre dossier et vous reviendra dans un délai maximum de 24h.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn btn-outline" 
                onClick={() => onNavigate('profile')}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                👤 Suivre sur mon profil
              </button>
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={() => { setActiveView('list'); setSelectedPetitionId(null); }}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                🗂️ Revenir aux doléances
              </button>
            </div>
          </div>

          {!currentPetition ? (
            <div className="premium-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <span style={{ fontSize: '2rem', display: 'inline-block' }} className="animate-pulse">⏳</span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                Initialisation du suivi en temps réel...
              </p>
            </div>
          ) : (
            <div className="premium-card" style={{ marginBottom: '2rem', border: '1.5px solid var(--primary)', background: 'var(--light-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Suivi de lancement en temps réel
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0 0 0' }}>{currentPetition.title}</h2>
              </div>
              <span 
                style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold', 
                  borderRadius: '20px', 
                  padding: '0.4rem 1rem', 
                  textTransform: 'uppercase',
                  background: currentPetition.status === 'active' 
                    ? 'rgba(0, 133, 63, 0.1)' 
                    : currentPetition.status === 'rejected' 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'rgba(252, 209, 22, 0.15)',
                  color: currentPetition.status === 'active' 
                    ? 'var(--primary)' 
                    : currentPetition.status === 'rejected' 
                    ? 'var(--danger)' 
                    : 'var(--secondary-dark)'
                }}
              >
                {currentPetition.status === 'active' 
                  ? 'Approuvée' 
                  : currentPetition.status === 'rejected' 
                  ? 'Action requise' 
                  : 'En cours d\'analyse'}
              </span>
            </div>

            {/* Stepper Pipeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', paddingLeft: '2.5rem', margin: '2rem 0' }}>
              {/* Stepper line */}
              <div 
                style={{ 
                  position: 'absolute', 
                  left: '11px', 
                  top: '12px', 
                  bottom: '12px', 
                  width: '2px', 
                  background: 'var(--border-light)',
                  zIndex: 0
                }} 
              />

              {/* Step 1: Soumission */}
              <div style={{ position: 'relative' }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: '-2.5rem', 
                    top: '2px', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  ✓
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1rem' }}>Étape 1 : Soumission réussie</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: '0.25rem 0 0 0' }}>
                    Votre doléance a été enregistrée dans notre registre décentralisé le {currentPetition.createdAt}.
                  </p>
                </div>
              </div>

              {/* Step 2: Consultation Admin */}
              <div style={{ position: 'relative' }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: '-2.5rem', 
                    top: '2px', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: currentPetition.viewedByAdmin ? 'var(--primary)' : 'var(--border-light)', 
                    color: currentPetition.viewedByAdmin ? 'white' : 'var(--text-secondary-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  {currentPetition.viewedByAdmin ? '✓' : '2'}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1rem' }}>
                    Étape 2 : Consultation par l'administration
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: '0.25rem 0 0 0' }}>
                    {currentPetition.viewedByAdmin 
                      ? "L'administrateur a ouvert et analysé votre dossier en temps réel." 
                      : "En attente d'ouverture et d'évaluation par l'administrateur de garde."}
                  </p>
                </div>
              </div>

              {/* Step 3: Décision réglementaire */}
              <div style={{ position: 'relative' }}>
                <div 
                  style={{ 
                    position: 'absolute', 
                    left: '-2.5rem', 
                    top: '2px', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: currentPetition.status === 'active' 
                      ? 'var(--primary)' 
                      : currentPetition.status === 'rejected' 
                      ? 'var(--danger)' 
                      : 'var(--border-light)', 
                    color: currentPetition.status === 'pending' ? 'var(--text-secondary-light)' : 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  {currentPetition.status === 'active' ? '✓' : currentPetition.status === 'rejected' ? '✕' : '3'}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1rem' }}>
                    Étape 3 : Évaluation & Décision réglementaire
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: '0.25rem 0 0 0' }}>
                    {currentPetition.status === 'active' 
                      ? "Félicitations ! La doléance a été approuvée, signée numériquement et publiée dans le flux public." 
                      : currentPetition.status === 'rejected' 
                      ? "La doléance a été suspendue. Veuillez prendre connaissance des motifs et modifier votre cause." 
                      : "Analyse administrative des objectifs et du descriptif en cours..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Outcomes */}
            {currentPetition.status === 'active' && (
              <div className="animate-slide-up" style={{ background: 'rgba(0,133,63,0.05)', border: '1px solid var(--primary)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🎉</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--primary)' }}>Votre cause est en ligne !</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: '0.25rem 0 0 0' }}>
                    Vous pouvez maintenant la partager, collecter des signatures et la booster pour maximiser son impact.
                  </p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setSelectedPetitionId(currentPetition.id);
                    setActiveView('detail');
                  }}
                >
                  Voir la pétition publique ➔
                </button>
              </div>
            )}

            {currentPetition.status === 'rejected' && (
              <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Admin Feedback Box */}
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--danger)' }}>
                    ⚠️ Motif de refus indiqué par l'administration :
                  </strong>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>
                    "{currentPetition.rejectionFeedback || 'Aucun détail fourni.'}"
                  </p>
                </div>

                {/* Correction Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    resubmitCampaign(
                      currentPetition.id, 
                      'petition', 
                      editTitle, 
                      editDescription, 
                      editSignaturesTarget,
                      editLocation,
                      editCoverImage,
                      editRecipient
                    );
                  }}
                  className="premium-card" 
                  style={{ background: 'var(--light)', padding: '1.25rem', border: '1px solid var(--border-light)' }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>📝 Formulaire de correction</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Titre de la doléance</label>
                      <input 
                        type="text" 
                        required 
                        className="premium-card" 
                        style={{ width: '100%', padding: '0.55rem', background: 'white' }}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>

                    <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Destinataire administratif</label>
                        <input 
                          type="text" 
                          required 
                          className="premium-card" 
                          style={{ width: '100%', padding: '0.55rem', background: 'white' }}
                          value={editRecipient}
                          onChange={(e) => setEditRecipient(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Région d'impact</label>
                        <select
                          className="premium-card"
                          style={{ width: '100%', padding: '0.55rem', background: 'white', borderRadius: 'var(--radius-md)' }}
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
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
                        </select>
                      </div>
                    </div>

                    <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Objectif de signatures</label>
                        <input 
                          type="number" 
                          required 
                          min={100}
                          className="premium-card" 
                          style={{ width: '100%', padding: '0.55rem', background: 'white' }}
                          value={editSignaturesTarget}
                          onChange={(e) => setEditSignaturesTarget(parseInt(e.target.value, 10))}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Image de couverture</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => document.getElementById('petition-edit-cover-upload')?.click()}
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', flex: 1 }}
                          >
                            📁 Modifier...
                          </button>
                          <input
                            id="petition-edit-cover-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditCoverImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {editCoverImage && (
                            <div 
                              style={{
                                width: '50px',
                                height: '35px',
                                borderRadius: '4px',
                                backgroundImage: `url(${editCoverImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '1px solid var(--border-light)',
                                flexShrink: 0
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Description & Lettre d'arguments</label>
                      <textarea
                        required
                        rows={5}
                        className="premium-card"
                        style={{ width: '100%', padding: '0.55rem', background: 'white', resize: 'none' }}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                      🔄 Soumettre à nouveau la pétition
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* SIGNATURE MODAL WITH OTP */}
      {showSignModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Signature de doléance</h3>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => { setShowSignModal(false); setOtpStep('form'); }}>
                ✕
              </button>
            </div>

            {otpStep === 'form' && (
              <form onSubmit={handleSignSubmit}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1rem' }}>
                  Veuillez remplir vos informations réelles. Une vérification d'identité par SMS OTP sera déclenchée.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Prénom & Nom</label>
                    <input 
                      type="text" 
                      required 
                      className="premium-card" 
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                      value={signName}
                      onChange={(e) => setSignName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>E-mail</label>
                    <input 
                      type="email" 
                      required 
                      className="premium-card" 
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                      value={signEmail}
                      onChange={(e) => setSignEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Téléphone Mobile</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="+221 77..."
                      className="premium-card" 
                      style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                      value={signPhone}
                      onChange={(e) => setSignPhone(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Recevoir le code de validation (OTP)
                </button>
              </form>
            )}

            {otpStep === 'otp' && (
              <form onSubmit={handleOtpSubmit} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Saisissez le code de validation à 4 chiffres reçu par SMS au <strong>{signPhone}</strong>.
                </p>
                
                {activeOtpCode && (
                  <div style={{ background: 'rgba(252,209,22,0.1)', border: '1px dashed var(--secondary-dark)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '1rem', color: 'var(--text-secondary-light)' }}>
                    🚨 Simulation OTP en cours : Le code généré est <strong>{activeOtpCode}</strong>
                  </div>
                )}

                <input 
                  type="text" 
                  required 
                  maxLength={4}
                  placeholder="0000"
                  className="premium-card" 
                  style={{ width: '120px', padding: '0.75rem', background: 'var(--light)', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '8px', marginBottom: '1.25rem' }}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setOtpStep('form')}>
                    Retour
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                    Confirmer la Signature
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && currentPetition && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>📢 Partager cette pétition</h3>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => setShowShareModal(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
              Aidez-nous à faire entendre notre voix ! Partagez cette pétition avec vos proches ou sur les réseaux sociaux.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(
                  `*✍️ Signez cette pétition sur Sunu Yité :* ${currentPetition.title}\n\nDestinataire : ${currentPetition.recipient}\n\n👉 Ensemble, faisons bouger les lignes ! Soutenez-nous ici : https://sunuyite.sn/petitions/${currentPetition.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn hover-scale"
                style={{ 
                  width: '100%', 
                  background: '#25D366', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  textDecoration: 'none',
                  padding: '0.65rem'
                }}
              >
                💚 Partager sur WhatsApp
              </a>

              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `https://sunuyite.sn/petitions/${currentPetition.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn hover-scale"
                style={{ 
                  width: '100%', 
                  background: '#1877F2', 
                  color: 'white', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem', 
                  textDecoration: 'none',
                  padding: '0.65rem'
                }}
              >
                💙 Partager sur Facebook
              </a>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Lien direct :</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  readOnly 
                  className="premium-card" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', background: 'var(--light)', border: '1px solid var(--border-light)' }}
                  value={`https://sunuyite.sn/petitions/${currentPetition.id}`}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(`https://sunuyite.sn/petitions/${currentPetition.id}`);
                    addNotification("📋 Lien copié dans le presse-papier !");
                  }}
                >
                  Copier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOST MODAL */}
      {showBoostModal && currentPetition && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
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
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            {/* Header */}
            <div 
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#111'
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>
                🚀 Propulser / Booster la Cause
              </h3>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.25rem 0.5rem', minWidth: 'auto', color: '#111' }}
                onClick={() => { setShowBoostModal(false); setBoostStep('package'); }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, textAlign: 'left' }}>
              {boostStep === 'package' && (
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
                    Soutenez activement cette pétition en lui offrant plus de visibilité auprès des citoyens sénégalais et de la diaspora.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {/* Pack 1 */}
                    <button
                      type="button"
                      className="premium-card hover-glow"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.85rem',
                        cursor: 'pointer',
                        width: '100%',
                        border: selectedPack === 'ndamel' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: selectedPack === 'ndamel' ? 'rgba(0, 133, 63, 0.03)' : 'var(--light-card)'
                      }}
                      onClick={() => setSelectedPack('ndamel')}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>🇸🇳 Pack Ndamel</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          Suggestion Régionale (+1 000 vues ciblées)
                        </span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>5 000 F</span>
                    </button>

                    {/* Pack 2 */}
                    <button
                      type="button"
                      className="premium-card hover-glow"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.85rem',
                        cursor: 'pointer',
                        width: '100%',
                        border: selectedPack === 'teranga' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: selectedPack === 'teranga' ? 'rgba(0, 133, 63, 0.03)' : 'var(--light-card)'
                      }}
                      onClick={() => setSelectedPack('teranga')}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>🤝 Pack Teranga</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          Flux Principal Prioritaire (+5 000 vues + Alerte E-mail)
                        </span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>15 000 F</span>
                    </button>

                    {/* Pack 3 */}
                    <button
                      type="button"
                      className="premium-card hover-glow"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.85rem',
                        cursor: 'pointer',
                        width: '100%',
                        border: selectedPack === 'lion' ? '2px solid #FFA500' : '1px solid var(--border-light)',
                        background: selectedPack === 'lion' ? 'rgba(255, 165, 0, 0.04)' : 'var(--light-card)'
                      }}
                      onClick={() => setSelectedPack('lion')}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>🦁 Lion de la Teranga</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          Impact National (Carte interactive + SMS Bénévoles +20K vues)
                        </span>
                      </div>
                      <span style={{ fontWeight: 'bold', color: '#FFA500' }}>50 000 F</span>
                    </button>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.75rem' }} 
                    onClick={() => setBoostStep('method')}
                  >
                    Continuer vers le Paiement ➔
                  </button>
                </div>
              )}

              {boostStep === 'method' && (
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem' }}>Saisir le moyen de paiement</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {/* Wave */}
                    <button
                      type="button"
                      className="premium-card hover-glow"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        width: '100%',
                        border: boostMethod === 'wave' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: 'white'
                      }}
                      onClick={() => setBoostMethod('wave')}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1da1f2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>W</div>
                      <span style={{ fontWeight: 'bold', color: '#333' }}>Wave</span>
                    </button>

                    {/* OM */}
                    <button
                      type="button"
                      className="premium-card hover-glow"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        width: '100%',
                        border: boostMethod === 'om' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: 'white'
                      }}
                      onClick={() => setBoostMethod('om')}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff6600', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>OM</div>
                      <span style={{ fontWeight: 'bold', color: '#333' }}>Orange Money</span>
                    </button>

                    {/* Card (Stripe) */}
                    <button
                      type="button"
                      className="premium-card hover-glow"
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '0.85rem',
                        cursor: 'pointer',
                        width: '100%',
                        border: boostMethod === 'card' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        background: 'white'
                      }}
                      onClick={() => setBoostMethod('card')}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6772e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>💳</div>
                      <span style={{ fontWeight: 'bold', color: '#333' }}>Carte Bancaire (Stripe)</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setBoostStep('package')}>
                      Retour
                    </button>
                    <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={() => setBoostStep('details')}>
                      Valider ➔
                    </button>
                  </div>
                </div>
              )}

              {boostStep === 'details' && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBoostLoading(true);
                    const amount = selectedPack === 'ndamel' ? 5000 : selectedPack === 'teranga' ? 15000 : 50000;
                    setTimeout(async () => {
                      const ref = `BST-${Math.floor(100000 + Math.random() * 900000)}`;
                      setBoostTxRef(ref);
                      const methodLabel = boostMethod === 'wave' ? 'Wave' : boostMethod === 'om' ? 'Orange Money' : 'Visa/Mastercard';
                      if (selectedPetitionId) {
                        await boostPetition(selectedPetitionId, selectedPack, amount, methodLabel);
                      }
                      setBoostLoading(false);
                      setBoostStep('success');
                    }, 2000);
                  }}
                >
                  <h4 style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                    Finalisation du paiement - {selectedPack === 'ndamel' ? '5 000' : selectedPack === 'teranga' ? '15 000' : '50 000'} FCFA
                  </h4>

                  {boostMethod !== 'card' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Numéro de téléphone mobile</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: +221 77 123 45 67"
                          className="premium-card" 
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                          value={boostPhone}
                          onChange={(e) => setBoostPhone(e.target.value)}
                        />
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary-light)', border: '1px dashed var(--border-light)' }}>
                        📱 Un pop-up de validation Wave ou Orange Money apparaîtra sur votre téléphone pour confirmer la transaction.
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Nom sur la carte</label>
                        <input 
                          type="text" 
                          required 
                          className="premium-card" 
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                          value={boostCardName}
                          onChange={(e) => setBoostCardName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Numéro de carte</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="4000 1234 5678 9010"
                          className="premium-card" 
                          style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                          value={boostCardNumber}
                          onChange={(e) => setBoostCardNumber(e.target.value)}
                        />
                      </div>
                      <div className="grid-cols-2" style={{ gap: '0.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Expiration</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="MM/AA"
                            className="premium-card" 
                            style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                            value={boostCardExpiry}
                            onChange={(e) => setBoostCardExpiry(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>CVV</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="123"
                            className="premium-card" 
                            style={{ width: '100%', padding: '0.55rem', background: 'var(--light)' }}
                            value={boostCardCvv}
                            onChange={(e) => setBoostCardCvv(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setBoostStep('method')} disabled={boostLoading}>
                      Retour
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={boostLoading}>
                      {boostLoading ? 'Validation...' : 'Confirmer & Payer'}
                    </button>
                  </div>
                </form>
              )}

              {boostStep === 'success' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
                  <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Pétition Propulsée !</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
                    Votre paiement a été traité avec succès. La pétition a été configurée avec le niveau de boost **{selectedPack === 'ndamel' ? 'Régional' : selectedPack === 'teranga' ? 'Prioritaire' : 'National'}** et apparaîtra en avant-plan.
                  </p>

                  <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', border: '1px solid var(--border-light)', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                    Réf : {boostTxRef}<br/>
                    Montant : {selectedPack === 'ndamel' ? '5 000' : selectedPack === 'teranga' ? '15 000' : '50 000'} F CFA<br/>
                    Statut : ACTIF
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.65rem' }} 
                    onClick={() => { setShowBoostModal(false); setBoostStep('package'); }}
                  >
                    Fermer & Retourner ➔
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
