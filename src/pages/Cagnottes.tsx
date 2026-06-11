import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Cagnotte } from '../types';
import { TrustScore } from '../components/TrustScore';
import { PaymentModal } from '../components/PaymentModal';

interface CagnottesProps {
  initialCagnotteId?: string;
  initialView?: 'list' | 'detail' | 'create' | 'tracking';
  initialAction?: string;
  onNavigate: (page: string, params?: any) => void;
  aiAppliedData?: any;
  setAiAppliedData?: (data: any) => void;
}

export const Cagnottes: React.FC<CagnottesProps> = ({ initialCagnotteId, initialView, initialAction, onNavigate, aiAppliedData, setAiAppliedData }) => {
  const { 
    cagnottes, 
    createCagnotte, 
    currentUser, 
    addCampaignUpdate,
    addCampaignExpense,
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
      setDescription(aiAppliedData.description);
      setActiveView('create');
      if (setAiAppliedData) {
        setAiAppliedData(null);
      }
    }
  }, [aiAppliedData, setAiAppliedData]);


  const [activeView, setActiveView] = useState<'list' | 'detail' | 'create' | 'tracking'>(
    initialView || (initialCagnotteId ? 'detail' : 'list')
  );
  
  const [selectedCagnotteId, setSelectedCagnotteId] = useState<string | null>(
    initialCagnotteId || null
  );

  React.useEffect(() => {
    if (currentUser && initialCagnotteId && initialAction === 'donate') {
      setShowPayModal(true);
    }
  }, [currentUser, initialCagnotteId, initialAction]);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountTarget, setAmountTarget] = useState(1000000);
  const [category, setCategory] = useState<'forage' | 'ecole' | 'mosquee' | 'ambulance' | 'eclairage' | 'sante' | 'autre'>('forage');
  const [location, setLocation] = useState('Dakar');
  const [isDiasporaTargeted, setIsDiasporaTargeted] = useState(false);
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80');
  const [documents, setDocuments] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);

  // Detail Sub-tabs
  const [detailTab, setDetailTab] = useState<'story' | 'transparency' | 'donors' | 'updates'>('story');

  // Payment Modal Trigger
  const [showPayModal, setShowPayModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Invoice view simulation
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);

  // Organizer: Add update / Add expense forms
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseCat, setExpenseCat] = useState('Matériaux');

  // Find active cagnotte
  const currentCagnotte = cagnottes.find(c => c.id === selectedCagnotteId);

  // States for cagnotte correction
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAmountTarget, setEditAmountTarget] = useState(1000000);
  const [editLocation, setEditLocation] = useState('Dakar');
  const [editIsDiasporaTargeted, setEditIsDiasporaTargeted] = useState(false);
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editDocuments, setEditDocuments] = useState<string[]>([]);
  const [editGallery, setEditGallery] = useState<string[]>([]);

  React.useEffect(() => {
    if (currentCagnotte && currentCagnotte.status === 'rejected') {
      setEditTitle(currentCagnotte.title);
      setEditDescription(currentCagnotte.description);
      setEditAmountTarget(currentCagnotte.amountTarget);
      setEditLocation(currentCagnotte.location);
      setEditIsDiasporaTargeted(currentCagnotte.isDiasporaTargeted);
      setEditCoverImage(currentCagnotte.coverImage);
      setEditDocuments(currentCagnotte.documents || []);
      setEditGallery(currentCagnotte.gallery || []);
    }
  }, [selectedCagnotteId, currentCagnotte?.status, currentCagnotte]);

  // Filters
  const filteredCagnottes = cagnottes.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
    const isActive = c.status === 'active';
    return matchesSearch && matchesCat && isActive;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = createCagnotte({
      title,
      description,
      amountTarget,
      category,
      location,
      isDiasporaTargeted,
      coverImage,
      documents,
      gallery
    });
    // Reset
    setTitle('');
    setDescription('');
    setAmountTarget(1000000);
    setLocation('');
    setIsDiasporaTargeted(false);
    setDocuments([]);
    setGallery([]);
    if (newId) {
      setSelectedCagnotteId(newId);
      setActiveView('tracking');
    } else {
      setActiveView('list');
    }
  };

  const handlePostUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCagnotteId && updateTitle && updateContent) {
      addCampaignUpdate(selectedCagnotteId, 'cagnotte', updateTitle, updateContent);
      setUpdateTitle('');
      setUpdateContent('');
      setShowUpdateForm(false);
    }
  };

  const handlePostExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCagnotteId && expenseDesc && expenseAmount > 0) {
      addCampaignExpense(selectedCagnotteId, expenseDesc, expenseAmount, expenseCat);
      setExpenseDesc('');
      setExpenseAmount(0);
      setShowExpenseForm(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Cagnottes Solidaires</h1>
          <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.9rem' }}>Financez participativement des projets de développement locaux.</p>
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
                onNavigate('auth', { redirectPage: 'cagnottes', redirectView: 'create' });
              }
            }}>
              🤝 Lancer une cagnotte
            </button>
          )}
          {activeView !== 'list' && (
            <button className="btn btn-outline" onClick={() => { setActiveView('list'); setSelectedCagnotteId(null); }}>
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
              placeholder="Rechercher une cagnotte, une ville..."
              style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--light-card)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {['all', 'forage', 'ecole', 'ambulance', 'sante', 'eclairage'].map((cat) => (
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
                  {cat === 'all' ? 'Tous' : cat === 'eclairage' ? 'Éclairage' : cat === 'ecole' ? 'École' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* CAGNOTTES FEED */}
          {filteredCagnottes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--light-card)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontWeight: 600 }}>Aucune cagnotte active trouvée.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
                Lancez une cagnotte pour le développement de votre village ou quartier !
              </p>
            </div>
          ) : (
            <div className="grid-cols-2" style={{ gap: '2rem' }}>
              {filteredCagnottes.map((cag) => {
                const percent = Math.min(100, Math.round((cag.amountCollected / cag.amountTarget) * 100));
                return (
                  <div key={cag.id} className="premium-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div 
                      style={{ 
                        height: '180px', 
                        borderRadius: 'var(--radius-md)', 
                        backgroundImage: `url(${cag.coverImage})`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        marginBottom: '1rem',
                        position: 'relative'
                      }} 
                    >
                      {cag.isDiasporaTargeted && (
                        <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--secondary)', color: 'var(--dark)', fontWeight: 'bold', fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                          🌍 Diaspora
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--secondary-dark)', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(252,209,22,0.15)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            {cag.category}
                          </span>
                          <TrustScore score={cag.organizer.trustScore} />
                        </div>
                        <h3 
                          style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem', cursor: 'pointer' }}
                          onClick={() => { setSelectedCagnotteId(cag.id); setActiveView('detail'); setDetailTab('story'); }}
                        >
                          {cag.title}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: '0.25rem' }}>
                          {cag.description}
                        </p>
                      </div>

                      <div style={{ marginTop: '1rem' }}>
                        {/* Progress Bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                          <span><strong>{cag.amountCollected.toLocaleString('fr-FR')} F</strong> récoltés</span>
                          <span style={{ color: 'var(--text-secondary-light)' }}>Cible : {cag.amountTarget.toLocaleString('fr-FR')} F</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '4px' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                            Région : <strong>{cag.location}</strong>
                          </span>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                            onClick={() => { setSelectedCagnotteId(cag.id); setActiveView('detail'); setDetailTab('story'); }}
                          >
                            Contribuer ➔
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
      {activeView === 'detail' && currentCagnotte && (
        <div className="responsive-grid-main-sidebar">
          {/* Main Content */}
          <div>
            <div 
              style={{ 
                height: '320px', 
                borderRadius: 'var(--radius-lg)', 
                backgroundImage: `url(${currentCagnotte.coverImage})`, 
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-light)',
                position: 'relative'
              }} 
            >
              {currentCagnotte.isDiasporaTargeted && (
                <span style={{ position: 'absolute', top: '15px', left: '15px', background: 'var(--secondary)', color: 'var(--dark)', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '6px', boxShadow: 'var(--shadow-md)' }}>
                  🌍 Projet Partenaire Diaspora Sénégal
                </span>
              )}
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <button 
                className="btn btn-ghost" 
                style={{ 
                  fontWeight: 800, 
                  color: detailTab === 'story' ? 'var(--primary)' : 'var(--text-secondary-light)',
                  borderBottom: detailTab === 'story' ? '2.5px solid var(--primary)' : 'none',
                  borderRadius: 0,
                  padding: '0.5rem 1rem'
                }}
                onClick={() => setDetailTab('story')}
              >
                📝 L'Histoire
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ 
                  fontWeight: 800, 
                  color: detailTab === 'transparency' ? 'var(--primary)' : 'var(--text-secondary-light)',
                  borderBottom: detailTab === 'transparency' ? '2.5px solid var(--primary)' : 'none',
                  borderRadius: 0,
                  padding: '0.5rem 1rem'
                }}
                onClick={() => setDetailTab('transparency')}
              >
                📊 Transparence & Dépenses
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ 
                  fontWeight: 800, 
                  color: detailTab === 'donors' ? 'var(--primary)' : 'var(--text-secondary-light)',
                  borderBottom: detailTab === 'donors' ? '2.5px solid var(--primary)' : 'none',
                  borderRadius: 0,
                  padding: '0.5rem 1rem'
                }}
                onClick={() => setDetailTab('donors')}
              >
                ❤️ Donateurs ({currentCagnotte.donors.length})
              </button>
              <button 
                className="btn btn-ghost" 
                style={{ 
                  fontWeight: 800, 
                  color: detailTab === 'updates' ? 'var(--primary)' : 'var(--text-secondary-light)',
                  borderBottom: detailTab === 'updates' ? '2.5px solid var(--primary)' : 'none',
                  borderRadius: 0,
                  padding: '0.5rem 1rem'
                }}
                onClick={() => setDetailTab('updates')}
              >
                📢 Actualités ({currentCagnotte.updates.length})
              </button>
            </div>

            {/* TAB CONTENTS */}
            {detailTab === 'story' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(252,209,22,0.15)', color: 'var(--secondary-dark)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    💰 Financement Participatif
                  </span>
                  <TrustScore score={currentCagnotte.organizer.trustScore} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>{currentCagnotte.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary-light)', marginBottom: '1.5rem' }}>
                  Soutien local à : <strong>{currentCagnotte.location}</strong> | Catégorie : <strong>{currentCagnotte.category}</strong>
                </p>

                <div className="premium-card" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{currentCagnotte.description}</p>
                </div>
              </div>
            )}

            {detailTab === 'transparency' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>📋 Registre des Dépenses</h3>
                <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Chaque franc collecté fait l'objet d'un justificatif comptable téléchargeable soumis à vérification.
                </p>

                {/* Organizer controls for expense ledger */}
                {currentUser && currentUser.id === currentCagnotte.organizer.id && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => setShowExpenseForm(!showExpenseForm)}
                    >
                      {showExpenseForm ? 'Fermer' : '➕ Déclarer une dépense / facture'}
                    </button>
                    {showExpenseForm && (
                      <form onSubmit={handlePostExpenseSubmit} className="premium-card" style={{ background: 'var(--light)', marginTop: '0.75rem' }}>
                        <div className="grid-cols-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <input 
                            type="text" 
                            required 
                            placeholder="Description (ex: Achat ciment)" 
                            className="premium-card"
                            style={{ padding: '0.5rem', background: 'white' }}
                            value={expenseDesc}
                            onChange={(e) => setExpenseDesc(e.target.value)}
                          />
                          <input 
                            type="number" 
                            required 
                            placeholder="Montant (FCFA)" 
                            className="premium-card"
                            style={{ padding: '0.5rem', background: 'white' }}
                            value={expenseAmount || ''}
                            onChange={(e) => setExpenseAmount(parseInt(e.target.value, 10))}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
                          <select 
                            className="premium-card"
                            style={{ padding: '0.5rem', background: 'white', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                            value={expenseCat}
                            onChange={(e) => setExpenseCat(e.target.value)}
                          >
                            <option value="Matériaux">Matériaux & Outillage</option>
                            <option value="Prestation technique">Prestation technique</option>
                            <option value="Frais logistiques">Frais logistiques</option>
                            <option value="Rémunération">Main d'œuvre</option>
                          </select>
                          <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
                            Ajouter au registre
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Expenses Table */}
                {currentCagnotte.expenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--light)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', fontStyle: 'italic' }}>
                      Aucune dépense enregistrée. Les fonds sont en cours de collecte.
                    </p>
                  </div>
                ) : (
                  <div className="premium-card" style={{ padding: 0, overflowX: 'auto', marginBottom: '2.5rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid var(--border-light)', background: 'var(--light)' }}>
                          <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Description</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Catégorie</th>
                          <th style={{ padding: '0.75rem 1rem' }}>Montant</th>
                          <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Justificatif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCagnotte.expenses.map((exp) => (
                          <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{exp.date}</td>
                            <td style={{ padding: '0.75rem 1rem' }}><strong>{exp.description}</strong></td>
                            <td style={{ padding: '0.75rem 1rem' }}>{exp.category}</td>
                            <td style={{ padding: '0.75rem 1rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                              -{exp.amount.toLocaleString('fr-FR')} F
                            </td>
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                              <button 
                                className="btn btn-ghost" 
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary)' }}
                                onClick={() => setViewInvoice({ ...exp, title: currentCagnotte.title })}
                              >
                                📄 Voir facture
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Transparency Timeline */}
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>📍 Étapes du projet</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', borderLeft: '2px solid var(--primary)', marginLeft: '1rem', paddingLeft: '1.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-2.15rem', top: '0.15rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Collecte en cours ({Math.round((currentCagnotte.amountCollected / currentCagnotte.amountTarget)*100)}%)</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Activité financière en temps réel.</p>
                  </div>
                  {currentCagnotte.expenses.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-2.15rem', top: '0.15rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />
                      <strong style={{ fontSize: '0.9rem' }}>Paiement prestataires de travaux</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Acompte réglé et étude technique validée.</p>
                    </div>
                  )}
                  <div style={{ position: 'relative', opacity: 0.5 }}>
                    <div style={{ position: 'absolute', left: '-2.15rem', top: '0.15rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--text-secondary-light)' }} />
                    <strong style={{ fontSize: '0.9rem' }}>Début des Travaux / Livraison</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>En attente de la libération totale du budget ciblé.</p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'donors' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>❤️ Liste des Donateurs Récents</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentCagnotte.donors.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary-light)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                      Aucun don enregistré pour le moment. Ouvrez le compteur en faisant un premier don !
                    </p>
                  ) : (
                    currentCagnotte.donors.map((don, idx) => {
                      const donorMatch = usersList.find(u => u.name && don.name && u.name.toLowerCase() === don.name.toLowerCase());
                      return (
                        <div key={idx} className="premium-card" style={{ background: 'var(--light)', padding: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                            <div 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                cursor: donorMatch ? 'pointer' : 'default'
                              }}
                              onClick={() => {
                                if (donorMatch) {
                                  setSelectedPublicUserId(donorMatch.id);
                                }
                              }}
                              title={donorMatch ? "Voir le profil de ce bienfaiteur" : undefined}
                            >
                              <strong style={{ color: donorMatch ? 'var(--primary)' : 'inherit', textDecoration: donorMatch ? 'underline' : 'none' }}>
                                {don.name}
                              </strong>
                              {don.isDiaspora && (
                                <span style={{ fontSize: '0.65rem', background: 'rgba(252,209,22,0.2)', color: 'var(--secondary-dark)', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                  🌍 Diaspora
                                </span>
                              )}
                            </div>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                              +{don.amount.toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                          {don.comment && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>"{don.comment}"</p>}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem', textAlign: 'right' }}>
                            Le {don.date}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {detailTab === 'updates' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>📢 Actualités du Projet ({currentCagnotte.updates.length})</h3>
                  {currentUser && currentUser.id === currentCagnotte.organizer.id && (
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

                {currentCagnotte.updates.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', fontStyle: 'italic' }}>
                    Aucune mise à jour publiée pour le moment.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {currentCagnotte.updates.map((upd) => (
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
            )}
          </div>

          {/* Right Action Sidebar */}
          <div>
            <div className="premium-card" style={{ position: 'sticky', top: '2rem', border: '1.5px solid var(--secondary)', background: 'var(--light-card)' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.75rem' }}>Soutenir le Projet</h3>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  <strong>{currentCagnotte.amountCollected.toLocaleString('fr-FR')} F</strong>
                  <span style={{ color: 'var(--text-secondary-light)' }}>Cible : {currentCagnotte.amountTarget.toLocaleString('fr-FR')} F</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--border-light)', borderRadius: '5px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${Math.min(100, Math.round((currentCagnotte.amountCollected / currentCagnotte.amountTarget) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '5px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                  Progression : <strong>{Math.round((currentCagnotte.amountCollected / currentCagnotte.amountTarget) * 100)}%</strong> récoltés
                </span>
              </div>

              {/* Organizer Card */}
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
                onClick={() => setSelectedPublicUserId(currentCagnotte.organizer.id)}
                title="Voir le profil de l'organisateur"
              >
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundImage: `url(${currentCagnotte.organizer.avatar})`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center' 
                  }} 
                />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Organisateur</div>
                  <strong style={{ fontSize: '0.85rem' }}>{currentCagnotte.organizer.name}</strong>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={() => {
                if (currentUser) {
                  setShowPayModal(true);
                } else {
                  onNavigate('auth', { redirectPage: 'cagnottes', redirectId: currentCagnotte.id, triggerAction: 'donate' });
                }
              }}>
                ❤️ Faire un don solidaire
              </button>

              <button 
                className="btn btn-outline" 
                style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
                onClick={() => setShowShareModal(true)}
              >
                📢 Partager la cause
              </button>

              <div style={{ textAlign: 'center', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>
                  💸 Intègre Wave, Orange Money et Stripe.
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                  Commission plateforme fixe de 3% à 5%.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CREATE VIEW */}
      {activeView === 'create' && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(252,209,22,0.06)', border: '1px dashed var(--secondary-dark)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div style={{ fontSize: '0.8rem' }}>
              <strong>L'IA est là pour vous !</strong> Ouvrez l'<strong>Assistant IA</strong> dans la barre supérieure pour générer les titres, descriptions et affiches pour votre cagnotte.
            </div>
          </div>

          <form onSubmit={handleCreateSubmit} className="premium-card">
            <h3 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Nouvelle Cagnotte Solidaire</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Titre de la cagnotte</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Forage d'eau potable solaire pour Barkedji"
                  className="premium-card"
                  style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid-cols-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Catégorie de projet</label>
                  <select
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)', borderRadius: 'var(--radius-md)' }}
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                  >
                    <option value="forage">Forage / Eau Potable</option>
                    <option value="ecole">École / Éducation</option>
                    <option value="mosquee">Mosquée / Communautaire</option>
                    <option value="ambulance">Santé / Ambulance / Médical</option>
                    <option value="eclairage">Éclairage Public Solaire</option>
                    <option value="autre">Autre Projet Social</option>
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Montant cible (FCFA)</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    className="premium-card"
                    style={{ width: '100%', padding: '0.65rem', background: 'var(--light)' }}
                    value={amountTarget}
                    onChange={(e) => setAmountTarget(parseInt(e.target.value, 10))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Importer une image de couverture</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => document.getElementById('cagnotte-cover-upload')?.click()}
                      style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', width: '100%' }}
                    >
                      📁 Choisir un fichier...
                    </button>
                    <input
                      id="cagnotte-cover-upload"
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

              {/* Documents d'identité & Justificatifs (Max 5) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
                  Justificatifs & Documents officiels (.pdf, .jpg, .png) - Max 5
                </label>
                
                {/* List of uploaded documents */}
                {documents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {documents.map((doc, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '0.5rem 0.75rem', 
                          background: 'var(--light)', 
                          border: '1px solid var(--border-light)', 
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <span>📄 {doc.length > 30 ? doc.substring(0, 27) + '...' : doc}</span>
                        <button 
                          type="button" 
                          className="btn btn-ghost" 
                          style={{ padding: '0.2rem 0.4rem', minWidth: 'auto', color: 'var(--danger)', fontSize: '0.8rem' }}
                          onClick={() => setDocuments(prev => prev.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add document button */}
                {documents.length < 5 && (
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => document.getElementById('cagnotte-doc-upload')?.click()}
                      style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', width: '100%' }}
                    >
                      📁 Ajouter un document ({documents.length}/5)
                    </button>
                    <input
                      id="cagnotte-doc-upload"
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDocuments(prev => [...prev, file.name]);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Galerie d'images illustrant le projet (Max 5) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>
                  Photos du projet (Galerie d'images) - Max 5
                </label>

                {/* Thumbnails of project gallery */}
                {gallery.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {gallery.map((img, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '6px', 
                          backgroundImage: `url(${img})`, 
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: '1px solid var(--border-light)',
                          position: 'relative'
                        }}
                      >
                        <button 
                          type="button"
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: 'var(--danger)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add photo button */}
                {gallery.length < 5 && (
                  <div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => document.getElementById('cagnotte-gallery-upload')?.click()}
                      style={{ padding: '0.55rem 1rem', fontSize: '0.8rem', width: '100%' }}
                    >
                      📷 Ajouter une photo ({gallery.length}/5)
                    </button>
                    <input
                      id="cagnotte-gallery-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setGallery(prev => [...prev, reader.result as string]);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,133,63,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <input 
                  type="checkbox" 
                  id="diasporaTarget" 
                  checked={isDiasporaTargeted} 
                  onChange={(e) => setIsDiasporaTargeted(e.target.checked)} 
                />
                <label htmlFor="diasporaTarget" style={{ fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                  Cibler prioritairement la Diaspora (Permet les contributions Stripe internationales)
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Description du projet</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Expliquez en détail le besoin, les devis prévus, et comment l'argent sera dépensé..."
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
                  Soumettre le projet
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
              Félicitations ! Votre cagnotte a été soumise avec succès
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary-light)', marginTop: '0.5rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              L'équipe de Sunu Yité étudiera vos justificatifs et vous reviendra dans un délai maximum de 24h.
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
                onClick={() => { setActiveView('list'); setSelectedCagnotteId(null); }}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                🗂️ Revenir aux cagnottes
              </button>
            </div>
          </div>

          {!currentCagnotte ? (
            <div className="premium-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <span style={{ fontSize: '2rem', display: 'inline-block' }} className="animate-pulse">⏳</span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary-light)' }}>
                Initialisation du suivi en temps réel...
              </p>
            </div>
          ) : (
            <div className="premium-card" style={{ marginBottom: '2rem', border: '1.5px solid var(--secondary)', background: 'var(--light-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Suivi de lancement en temps réel
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0 0 0' }}>{currentCagnotte.title}</h2>
              </div>
              <span 
                style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: 'bold', 
                  borderRadius: '20px', 
                  padding: '0.4rem 1rem', 
                  textTransform: 'uppercase',
                  background: currentCagnotte.status === 'active' 
                    ? 'rgba(0, 133, 63, 0.1)' 
                    : currentCagnotte.status === 'rejected' 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'rgba(252, 209, 22, 0.15)',
                  color: currentCagnotte.status === 'active' 
                    ? 'var(--primary)' 
                    : currentCagnotte.status === 'rejected' 
                    ? 'var(--danger)' 
                    : 'var(--secondary-dark)'
                }}
              >
                {currentCagnotte.status === 'active' 
                  ? 'Approuvée' 
                  : currentCagnotte.status === 'rejected' 
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
                    Votre projet de cagnotte a été soumis et enregistré le {currentCagnotte.createdAt}.
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
                    background: currentCagnotte.viewedByAdmin ? 'var(--primary)' : 'var(--border-light)', 
                    color: currentCagnotte.viewedByAdmin ? 'white' : 'var(--text-secondary-light)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  {currentCagnotte.viewedByAdmin ? '✓' : '2'}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1rem' }}>
                    Étape 2 : Vérification des pièces justificatives
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: '0.25rem 0 0 0' }}>
                    {currentCagnotte.viewedByAdmin 
                      ? "L'administrateur a consulté et ouvert vos justificatifs en temps réel." 
                      : "Dossier en file d'attente d'analyse pour validation administrative."}
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
                    background: currentCagnotte.status === 'active' 
                      ? 'var(--primary)' 
                      : currentCagnotte.status === 'rejected' 
                      ? 'var(--danger)' 
                      : 'var(--border-light)', 
                    color: currentCagnotte.status === 'pending' ? 'var(--text-secondary-light)' : 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    zIndex: 1
                  }}
                >
                  {currentCagnotte.status === 'active' ? '✓' : currentCagnotte.status === 'rejected' ? '✕' : '3'}
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1rem' }}>
                    Étape 3 : Décision réglementaire & Publication
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: '0.25rem 0 0 0' }}>
                    {currentCagnotte.status === 'active' 
                      ? "Félicitations ! Votre cagnotte a été approuvée et publiée. La collecte est ouverte aux dons." 
                      : currentCagnotte.status === 'rejected' 
                      ? "Validation suspendue en raison de justificatifs non conformes ou d'informations incomplètes." 
                      : "Examen final de conformité comptable et éthique en cours..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Outcomes */}
            {currentCagnotte.status === 'active' && (
              <div className="animate-slide-up" style={{ background: 'rgba(0,133,63,0.05)', border: '1px solid var(--primary)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>🎉</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--primary)' }}>Cagnotte active et visible en ligne !</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: '0.25rem 0 0 0' }}>
                    Votre projet a été approuvé. Partagez le lien avec vos proches et la diaspora pour collecter des fonds.
                  </p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setSelectedCagnotteId(currentCagnotte.id);
                    setActiveView('detail');
                    setDetailTab('story');
                  }}
                >
                  Voir ma cagnotte en direct ➔
                </button>
              </div>
            )}

            {currentCagnotte.status === 'rejected' && (
              <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Admin Feedback Box */}
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--danger)' }}>
                    ⚠️ Motif de refus et corrections demandées par l'admin :
                  </strong>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 600, color: 'var(--text-primary-light)' }}>
                    "{currentCagnotte.rejectionFeedback || 'Aucune pièce complémentaire demandée.'}"
                  </p>
                </div>

                {/* Correction Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    resubmitCampaign(
                      currentCagnotte.id, 
                      'cagnotte', 
                      editTitle, 
                      editDescription, 
                      editAmountTarget,
                      editLocation,
                      editCoverImage,
                      undefined, // recipient is not used for cagnotte
                      editIsDiasporaTargeted,
                      editDocuments,
                      editGallery
                    );
                  }}
                  className="premium-card" 
                  style={{ background: 'var(--light)', padding: '1.25rem', border: '1px solid var(--border-light)' }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>📝 Formulaire de correction</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Titre de la cagnotte</label>
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
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Montant cible (FCFA)</label>
                        <input 
                          type="number" 
                          required 
                          min={10000}
                          className="premium-card" 
                          style={{ width: '100%', padding: '0.55rem', background: 'white' }}
                          value={editAmountTarget}
                          onChange={(e) => setEditAmountTarget(parseInt(e.target.value, 10))}
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
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Image de couverture</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => document.getElementById('cagnotte-edit-cover-upload')?.click()}
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem', flex: 1 }}
                          >
                            📁 Modifier...
                          </button>
                          <input
                            id="cagnotte-edit-cover-upload"
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

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,133,63,0.03)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                        <input 
                          type="checkbox" 
                          id="editDiasporaTarget" 
                          checked={editIsDiasporaTargeted} 
                          onChange={(e) => setEditIsDiasporaTargeted(e.target.checked)} 
                        />
                        <label htmlFor="editDiasporaTarget" style={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                          Cibler la Diaspora (Stripe)
                        </label>
                      </div>
                    </div>

                    {/* Documents correction */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        Justificatifs & Documents officiels (Max 5)
                      </label>
                      {editDocuments.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                          {editDocuments.map((doc, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '0.4rem 0.6rem', 
                                background: 'white', 
                                border: '1px solid var(--border-light)', 
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem'
                              }}
                            >
                              <span>📄 {doc.length > 30 ? doc.substring(0, 27) + '...' : doc}</span>
                              <button 
                                type="button" 
                                className="btn btn-ghost" 
                                style={{ padding: '0.1rem 0.3rem', minWidth: 'auto', color: 'var(--danger)', fontSize: '0.75rem' }}
                                onClick={() => setEditDocuments(prev => prev.filter((_, i) => i !== idx))}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {editDocuments.length < 5 && (
                        <div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => document.getElementById('cagnotte-edit-doc-upload')?.click()}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', width: '100%' }}
                          >
                            📁 Ajouter un document ({editDocuments.length}/5)
                          </button>
                          <input
                            id="cagnotte-edit-doc-upload"
                            type="file"
                            accept=".pdf,image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditDocuments(prev => [...prev, file.name]);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Gallery correction */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        Photos du projet (Max 5)
                      </label>
                      {editGallery.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          {editGallery.map((img, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                width: '50px', 
                                height: '50px', 
                                borderRadius: '4px', 
                                backgroundImage: `url(${img})`, 
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: '1px solid var(--border-light)',
                                position: 'relative'
                              }}
                            >
                              <button 
                                type="button"
                                style={{
                                  position: 'absolute',
                                  top: '-5px',
                                  right: '-5px',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: 'var(--danger)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '0.6rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onClick={() => setEditGallery(prev => prev.filter((_, i) => i !== idx))}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {editGallery.length < 5 && (
                        <div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => document.getElementById('cagnotte-edit-gallery-upload')?.click()}
                            style={{ padding: '0.45rem 1rem', fontSize: '0.75rem', width: '100%' }}
                          >
                            📷 Ajouter une photo ({editGallery.length}/5)
                          </button>
                          <input
                            id="cagnotte-edit-gallery-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditGallery(prev => [...prev, reader.result as string]);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Description du projet</label>
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
                      🔄 Soumettre à nouveau le projet
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* PAYMENT INTEGRATION */}
      {showPayModal && currentCagnotte && (
        <PaymentModal cagnotte={currentCagnotte} onClose={() => setShowPayModal(false)} />
      )}

      {/* INVOICE MODAL VIEWER */}
      {viewInvoice && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
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
              maxWidth: '500px',
              background: '#fff',
              color: '#333',
              borderRadius: 'var(--radius-md)',
              padding: '2rem',
              boxShadow: 'var(--shadow-lg)',
              fontFamily: 'Courier New, monospace'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ fontSize: '1.2rem' }}>FACTURE JUSTIFICATIVE</strong>
                <div>Référence : {viewInvoice.id.toUpperCase()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>SUNU YITÉ</strong>
                <div>Date : {viewInvoice.date}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div><strong>Campagne liée :</strong> {viewInvoice.title}</div>
              <div><strong>Prestataire :</strong> Sahel Distribution / Fournisseur local</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', borderTop: '1px solid #333' }}>
                  <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Item</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem 0' }}>{viewInvoice.description} ({viewInvoice.category})</td>
                  <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{viewInvoice.amount.toLocaleString('fr-FR')} F</td>
                </tr>
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid #333', paddingTop: '0.5rem', textAlign: 'right', fontSize: '1.1rem', marginBottom: '2rem' }}>
              <strong>Net à Payer : {viewInvoice.amount.toLocaleString('fr-FR')} FCFA</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-outline" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid #333', color: '#333' }}
                onClick={() => {
                  alert("Facture originale téléchargée avec succès au format PDF.");
                }}
              >
                💾 Télécharger PDF
              </button>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: '#333', color: '#fff' }}
                onClick={() => setViewInvoice(null)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && currentCagnotte && (
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
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>📢 Partager cette cagnotte</h3>
              <button className="btn btn-ghost" style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} onClick={() => setShowShareModal(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '1.25rem' }}>
              Chaque don, chaque partage rapproche ce projet de sa réalisation. Partagez cette cagnotte solidaire !
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(
                  `*🤝 Soutenez ce projet solidaire sur Sunu Yité :* ${currentCagnotte.title}\n\n📍 Région : ${currentCagnotte.location}\n\n👉 Faites un don via Wave/OM ou partagez le lien pour nous aider : https://sunuyite.sn/cagnottes/${currentCagnotte.id}`
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
                  `https://sunuyite.sn/cagnottes/${currentCagnotte.id}`
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
                  value={`https://sunuyite.sn/cagnottes/${currentCagnotte.id}`}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(`https://sunuyite.sn/cagnottes/${currentCagnotte.id}`);
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
    </div>
  );
};
