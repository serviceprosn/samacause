import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VolunteerMission } from '../types';

interface BenevolatProps {
  initialMissionId?: string;
  initialView?: 'list' | 'detail' | 'create';
  initialAction?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const Benevolat: React.FC<BenevolatProps> = ({ initialMissionId, initialView, initialAction, onNavigate }) => {
  const { volunteerMissions, createVolunteerMission, applyToMission, currentUser } = useApp();

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

  // Application form state
  const [showApplyModal, setShowApplyModal] = useState(false);
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
    if (currentUser && initialMissionId && initialAction === 'apply') {
      setShowApplyModal(true);
    }
  }, [currentUser, initialMissionId, initialAction]);

  // Find active mission
  const currentMission = volunteerMissions.find(m => m.id === selectedMissionId);

  // Filters
  const filteredMissions = volunteerMissions.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase()) || 
                          m.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVolunteerMission({
      title,
      description,
      location,
      duration,
      needs,
      category,
      volunteersTarget,
      coverImage
    });
    // Reset
    setTitle('');
    setDescription('');
    setLocation('');
    setDuration('');
    setNeeds('');
    setActiveView('list');
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
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Missions de Bénévolat</h1>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.9rem' }}>Engagez-vous physiquement et soutenez des causes sur le terrain.</p>
        </div>
        <div>
          {activeView === 'list' && (
            <button className="btn btn-primary" onClick={() => {
              if (currentUser) {
                setActiveView('create');
              } else {
                onNavigate('auth', { redirectPage: 'benevolat', redirectView: 'create' });
              }
            }}>
              🛠️ Publier une mission
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
              placeholder="Rechercher une mission, un lieu..."
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
              <p style={{ fontWeight: 600 }}>Aucune mission de bénévolat trouvée.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
                Revenez plus tard ou publiez vous-même un besoin en bénévoles pour votre communauté.
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
                          <span><strong>{m.volunteersCount}</strong> bénévoles inscrits</span>
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
              🛠️ Mission Bénévolat
            </span>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.75rem 0 0.5rem' }}>{currentMission.title}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
              Lieu d'action : <strong>{currentMission.location}</strong> | Durée de la mission : <strong>{currentMission.duration}</strong>
            </p>

            <div className="premium-card" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                Description de la mission
              </h3>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{currentMission.description}</p>
            </div>

            <div className="premium-card" style={{ background: 'rgba(0,133,63,0.03)', borderColor: 'rgba(0,133,63,0.1)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                📋 Besoins et Matériel requis
              </h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{currentMission.needs}</p>
            </div>
          </div>

          {/* Right Action Sidebar */}
          <div>
            <div className="premium-card" style={{ position: 'sticky', top: '2rem', border: '1.5px solid var(--primary)', background: 'var(--light-card)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>Participer au Projet</h3>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <strong>{currentMission.volunteersCount} inscrits</strong>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Cible : {currentMission.volunteersTarget}</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--border-light)', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${Math.min(100, Math.round((currentMission.volunteersCount / currentMission.volunteersTarget) * 100))}%`, height: '100%', background: 'var(--primary)', borderRadius: '5px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                  Progression : <strong>{Math.round((currentMission.volunteersCount / currentMission.volunteersTarget) * 100)}%</strong> de l'objectif de recrutement.
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Lancé par</div>
                  <strong style={{ fontSize: '0.85rem' }}>{currentMission.organizer.name}</strong>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={() => {
                if (currentUser) {
                  setShowApplyModal(true);
                } else {
                  onNavigate('auth', { redirectPage: 'benevolat', redirectId: currentMission.id, triggerAction: 'apply' });
                }
              }}>
                🛠️ Rejoindre la mission
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
            <h3 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Créer une Mission Bénévolat</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Titre de la mission</label>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Catégorie</label>
                  <select
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                  >
                    <option value="social">Social & Solidarité</option>
                    <option value="environnement">Environnement & Reboisement</option>
                    <option value="education">Soutien Scolaire / Éducation</option>
                    <option value="sante">Santé / Distribution Médicale</option>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Durée de l'action</label>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Nombre de bénévoles ciblés</label>
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

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Matériel à prévoir / Spécifications</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Prévoir des bottes, casquettes, gourdes"
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Description & Objectifs détaillés</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Décrivez en détail la nature de l'action bénévole sur le terrain..."
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
                  Publier la mission
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

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
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Candidature Bénévolat</h3>
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
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Téléphone</label>
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
    </div>
  );
};
