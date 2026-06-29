import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { VolunteerMission } from '../types';
import { uploadBase64ToStorage } from '../services/supabaseClient';

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

interface BenevolatProps {
  initialMissionId?: string;
  initialView?: 'list' | 'detail' | 'create';
  initialAction?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const Benevolat: React.FC<BenevolatProps> = ({ initialMissionId, initialView, initialAction, onNavigate }) => {
  const { volunteerMissions, createVolunteerMission, applyToMission, currentUser, updateCampaignAfterImage, isBasicProfileComplete, addNotification } = useApp();
  const { t } = useLanguage();

  const [activeView, setActiveView] = useState<'list' | 'detail' | 'create'>(
    initialMissionId ? 'detail' : (initialView || 'list')
  );
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(
    initialMissionId || null
  );

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Dakar');
  const [duration, setDuration] = useState('');
  const [needs, setNeeds] = useState('');
  const [category, setCategory] = useState<'social' | 'environnement' | 'education' | 'sante'>('social');
  const [volunteersTarget, setVolunteersTarget] = useState(10);
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80');
  const [imageBefore, setImageBefore] = useState('');
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  // Application form state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [appName, setAppName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appMessage, setAppMessage] = useState('');

  // Sync user info and handle initial trigger actions
  React.useEffect(() => {
    if (currentUser) {
      setAppName(currentUser.name || '');
      setAppEmail(currentUser.email || '');
      setAppPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (initialMissionId && initialAction === 'apply') {
      setShowApplyModal(true);
    }
  }, [initialMissionId, initialAction]);

  // Find active mission
  const currentMission = volunteerMissions.find(m => m.id === selectedMissionId);

  // Filters
  const filteredMissions = volunteerMissions.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = await createVolunteerMission({
      title,
      description,
      location,
      duration,
      needs,
      category,
      volunteersTarget,
      coverImage,
      imageBefore
    });
    if (newId) {
      // Reset
      setTitle('');
      setDescription('');
      setLocation('');
      setDuration('');
      setNeeds('');
      setImageBefore('');
      setActiveView('list');
    }
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMissionId) {
      applyToMission(selectedMissionId, appName, appEmail, appPhone, appMessage);
      setShowApplyModal(false);
      setAppMessage('');
    }
  };

  return (
    <>
      <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('benevolat.title')}</h1>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.9rem' }}>Collaborez et investissez dans des initiatives citoyennes pour le développement local.</p>
        </div>
        <div>
          {activeView === 'list' && (
            <button className="btn btn-primary" onClick={() => {
              if (currentUser) {
                if (!isBasicProfileComplete(currentUser)) {
                  addNotification("🔒 Coordonnées de profil incomplètes. Veuillez renseigner vos informations de base pour publier un projet en commun.");
                  onNavigate('profile', { requireCompletion: true, target: 'basic' });
                } else {
                  setActiveView('create');
                }
              } else {
                onNavigate('auth', { redirectPage: 'benevolat', redirectView: 'create' });
              }
            }}>
              🛠️ Publier un projet
            </button>
          )}
          {activeView !== 'list' && (
            <button className="btn btn-outline" onClick={() => { setActiveView('list'); setSelectedMissionId(null); }}>
              🗂️ Revenir au flux
            </button>
          )}
        </div>
      </div>

      {/* 1. LIST VIEW */}
      {activeView === 'list' && (
        <div>
          {/* SEARCH & FILTERS */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="premium-card"
              placeholder={t('benevolat.search_placeholder')}
              style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--light-card)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {['all', 'environnement', 'education', 'sante', 'social'].map((cat) => (
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
                  {cat === 'all' ? 'Tous' : cat === 'sante' ? 'Santé' : cat === 'education' ? 'Éducation' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* MISSIONS GRID */}
          {filteredMissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--light-card)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontWeight: 600 }}>{t('benevolat.no_results')}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
                Revenez plus tard ou publiez vous-même un projet en commun pour votre communauté.
              </p>
            </div>
          ) : (
            <div className="grid-cols-3" style={{ gap: '2rem' }}>
              {filteredMissions.map((m) => {
                const percent = Math.min(100, Math.round((m.volunteersCount / m.volunteersTarget) * 100));
                return (
                  <div key={m.id} className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div 
                      style={{ 
                        height: '160px', 
                        borderRadius: 'var(--radius-md)', 
                        backgroundImage: `url(${m.coverImage})`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        marginBottom: '1rem'
                      }} 
                    />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(0,133,63,0.08)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          {m.category}
                        </span>
                        <h3 
                          style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.5rem', cursor: 'pointer' }}
                          onClick={() => { setSelectedMissionId(m.id); setActiveView('detail'); }}
                        >
                          {m.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: '0.25rem' }}>
                          {m.description}
                        </p>
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        {/* Recruitment progress bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span><strong>{m.volunteersCount}</strong> {t('benevolat.volunteers_inscribed')}</span>
                          <span style={{ color: 'var(--text-secondary-light)' }}>Objectif : {m.volunteersTarget}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                            Lieu : <strong>{m.location}</strong>
                          </span>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                            onClick={() => { setSelectedMissionId(m.id); setActiveView('detail'); }}
                          >
                            Rejoindre ➔
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

      {/* 2. DETAIL VIEW (LOADING PLACEHOLDER) */}
      {activeView === 'detail' && !currentMission && (
        <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <span style={{ fontSize: '2.5rem', display: 'inline-block' }} className="animate-pulse">⏳</span>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary-light)', fontWeight: 600 }}>
            Chargement des détails de la mission...
          </p>
        </div>
      )}

      {/* 2. DETAIL VIEW */}
      {activeView === 'detail' && currentMission && (
        <div className="responsive-grid-main-sidebar">
          {/* Main Content */}
          <div>
            <div 
              style={{ 
                height: '320px', 
                borderRadius: 'var(--radius-lg)', 
                backgroundImage: `url(${currentMission.coverImage})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-light)'
              }} 
            />

            <span style={{ fontSize: '0.8rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              🛠️ Projet en commun
            </span>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.75rem 0 0.5rem' }}>{currentMission.title}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
              {t('profile.location')} : <strong>{currentMission.location}</strong> | {t('benevolat.duration_label')} <strong>{currentMission.duration}</strong>
            </p>

            <div className="premium-card" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                Description du projet
              </h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{currentMission.description}</p>
            </div>

            {/* Before / After Comparison */}
            {(currentMission.imageBefore || currentMission.imageAfter || (currentUser && currentUser.id === currentMission.organizer.id)) && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📸 Évolution du projet : Avant / Après</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: currentMission.imageBefore && (currentMission.imageAfter || (currentUser && currentUser.id === currentMission.organizer.id)) ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                  {currentMission.imageBefore && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary-light)', textTransform: 'uppercase' }}>{t('benevolat.detail.initial_state')}</span>
                      <div 
                        onClick={() => setSelectedLightboxImage(currentMission.imageBefore || null)}
                        style={{ 
                          height: '180px', 
                          borderRadius: 'var(--radius-md)', 
                          backgroundImage: `url(${currentMission.imageBefore})`, 
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid var(--border-light)',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                        className="hover-scale"
                      />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>{t('benevolat.detail.resolved_state')}</span>
                    {currentMission.imageAfter ? (
                      <div 
                        onClick={() => setSelectedLightboxImage(currentMission.imageAfter || null)}
                        style={{ 
                          height: '180px', 
                          borderRadius: 'var(--radius-md)', 
                          backgroundImage: `url(${currentMission.imageAfter})`, 
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1.5px solid var(--primary)',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                        className="hover-scale"
                      />
                    ) : (
                      currentUser && currentUser.id === currentMission.organizer.id ? (
                        <div 
                          style={{ 
                            height: '180px', 
                            borderRadius: 'var(--radius-md)', 
                            border: '2.5px dashed var(--primary)',
                            background: 'rgba(0,133,63,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => document.getElementById('volunteer-after-upload-detail')?.click()}
                        >
                          <span style={{ fontSize: '1.5rem' }}>📷</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>{t('benevolat.detail.add_final_pic')}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary-light)' }}>{t('benevolat.detail.show_final_result')}</span>
                          <input
                            id="volunteer-after-upload-detail"
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
                                  compressImage(reader.result as string).then(compressed => {
                                     uploadBase64ToStorage(compressed, 'volunteer').then(storageUrl => {
                                       updateCampaignAfterImage(currentMission.id, 'volunteer', storageUrl);
                                     });
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div 
                          style={{ 
                            height: '180px', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px dashed var(--border-light)',
                            background: 'var(--light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary-light)',
                            fontSize: '0.8rem',
                            fontStyle: 'italic'
                          }}
                        >
                          En attente de réalisation...
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="premium-card" style={{ background: 'rgba(0,133,63,0.03)', borderColor: 'rgba(0,133,63,0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                📋 Besoins et collaboration requis
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{currentMission.needs}</p>
            </div>
          </div>

          {/* Right Action Sidebar */}
          <div>
            <div className="premium-card sticky-sidebar-card" style={{ border: '1.5px solid var(--primary)', background: 'var(--light-card)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>{t('benevolat.detail.join_project')}</h3>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <strong>{currentMission.volunteersCount} inscrits</strong>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Cible : {currentMission.volunteersTarget}</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--border-light)', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${Math.min(100, Math.round((currentMission.volunteersCount / currentMission.volunteersTarget) * 100))}%`, height: '100%', background: 'var(--primary)', borderRadius: '5px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                  Progression : <strong>{Math.round((currentMission.volunteersCount / currentMission.volunteersTarget) * 100)}%</strong> de l'objectif de collaboration.
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
                  marginBottom: '1.25rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{t('benevolat.detail.launched_by')}</div>
                  <strong style={{ fontSize: '0.85rem' }}>{currentMission.organizer.name}</strong>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={() => {
                setShowApplyModal(true);
              }}>
                🛠️ Rejoindre le projet
              </button>

              <button 
                className="btn btn-outline" 
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
                onClick={() => setShowShareModal(true)}
              >
                📢 Partager la cause
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>
                  🎒 Les détails logistiques (départ, tentes, repas) seront coordonnés par e-mail et WhatsApp.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE VIEW */}
      {activeView === 'create' && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <form onSubmit={handleCreateSubmit} className="premium-card">
            <h3 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>{t('benevolat.form.create_title')}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Titre du projet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Reboisement de la Grande Muraille Verte"
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid-cols-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('benevolat.form.category')}</label>
                  <select
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                  >
                    <option value="social">{t('benevolat.form.cat_social')}</option>
                    <option value="environnement">Environnement & Reboisement</option>
                    <option value="education">Soutien Scolaire / Éducation</option>
                    <option value="sante">Santé / Distribution Médicale</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('auth.region_label')}</label>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('benevolat.form.duration')}</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : 2 jours (Week-end)"
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('benevolat.form.target_volunteers')}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={volunteersTarget}
                    onChange={(e) => setVolunteersTarget(parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Importer une image descriptive</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => document.getElementById('mission-cover-upload')?.click()}
                    style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', width: '100%' }}
                  >
                    📁 Choisir un fichier...
                  </button>
                  <input
                    id="mission-cover-upload"
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
                          compressImage(reader.result as string).then(compressed => {
                            uploadBase64ToStorage(compressed, 'volunteer').then(storageUrl => setCoverImage(storageUrl));
                          });
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

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Image de la cause / du site (Avant le projet)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => document.getElementById('mission-before-upload')?.click()}
                    style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', width: '100%' }}
                  >
                    📁 Choisir une photo...
                  </button>
                  <input
                    id="mission-before-upload"
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
                          compressImage(reader.result as string).then(compressed => {
                            uploadBase64ToStorage(compressed, 'volunteer').then(storageUrl => setImageBefore(storageUrl));
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {imageBefore && (
                    <div 
                      style={{
                        width: '60px',
                        height: '40px',
                        borderRadius: '6px',
                        backgroundImage: `url(${imageBefore})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid var(--border-light)',
                        flexShrink: 0
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Matériel à prévoir / Spécifications</label>
                <input
                  type="text"
                  required
                  placeholder={t('benevolat.form.requirements_placeholder')}
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>{t('benevolat.form.description')}</label>
                <textarea
                  required
                  rows={5}
                  placeholder={t('benevolat.form.description_placeholder')}
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
                  Publier le projet
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      </div>

      {/* APPLICATION MODAL */}
      {showApplyModal && currentMission && (
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
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t('benevolat.apply.title')}</h3>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => setShowApplyModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1rem' }}>
                Confirmez vos coordonnées de contact pour être recontacté par l'équipe logistique.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Votre Nom complet</label>
                  <input 
                    type="text" 
                    required 
                    className="premium-card" 
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>E-mail</label>
                  <input 
                    type="email" 
                    required 
                    className="premium-card" 
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                    value={appEmail}
                    onChange={(e) => setAppEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('benevolat.apply.phone')}</label>
                  <input 
                    type="text" 
                    required 
                    className="premium-card" 
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--light)' }}
                    value={appPhone}
                    onChange={(e) => setAppPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Message de motivation (optionnel)</label>
                  <textarea 
                    rows={3}
                    placeholder="Pourquoi souhaitez-vous rejoindre cette action ?"
                    className="premium-card" 
                    style={{ width: '100%', padding: '0.5rem', background: 'var(--light)', resize: 'none', fontSize: '0.85rem' }}
                    value={appMessage}
                    onChange={(e) => setAppMessage(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowApplyModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Confirmer mon engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && currentMission && (() => {
        const directLink = `${window.location.origin}/cause?benevolat=${currentMission.id}`;
        return (
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
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>📢 Partager le projet</h3>
                <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => setShowShareModal(false)}>
                  ✕
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
                Mobilisons-nous pour le développement local ! Partagez ce projet en commun avec vos proches ou sur les réseaux sociaux.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `*🛠️ Rejoignez ce projet citoyen sur Sunu Yité :* ${currentMission.title}\n\n📍 Région : ${currentMission.location}\n\n👉 Collaborez au projet ou partagez le lien : ${directLink}`
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
                    directLink
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
                    value={directLink}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(directLink);
                      addNotification("📋 Lien copié dans le presse-papier !");
                    }}
                  >
                    Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedLightboxImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedLightboxImage(null)}
        >
          <button 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              background: 'rgba(255,255,255,0.2)', 
              border: 'none', 
              color: 'white', 
              fontSize: '1.5rem', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '50%', 
              cursor: 'pointer' 
            }}
            onClick={() => setSelectedLightboxImage(null)}
          >
            ✕
          </button>
          <img 
            src={selectedLightboxImage} 
            alt="Agrandissement" 
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '2px solid white' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
