import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { TrustScore } from '../components/TrustScore';
import { supabase } from '../services/supabaseClient';
export const Admin: React.FC = () => {
  const { 
    petitions, 
    cagnottes, 
    tontines,
    volunteerMissions,
    approveCampaign, 
    rejectCampaign, 
    markCampaignAsViewed,
    getKPIs,
    usersList,
    setCurrentUser,
    currentUser,
    adminUpdateUser,
    loadUserKycDocs,
    deletePublication,
    withdrawalRequests,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    sendDirectMessage
  } = useApp();
  const { t } = useLanguage();
  const [rejectingCampaignId, setRejectingCampaignId] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  // Modals states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Publications management states
  const [publicationSearch, setPublicationSearch] = useState('');
  const [publicationFilter, setPublicationFilter] = useState<'all' | 'petition' | 'cagnotte' | 'volunteer_mission' | 'tontine'>('all');

  // KYC Rejection states
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [kycRejectReasonText, setKycRejectReasonText] = useState('');

  // KYC Filter state
  const [kycFilter, setKycFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');

  // Contact reply states
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [directReplyText, setDirectReplyText] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      setMessagesLoading(true);
      supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          setMessagesLoading(false);
          if (error) {
            console.error("Erreur lors de la récupération des messages :", error);
          } else if (data) {
            setContactMessages(data);
          }
        });
    }
  }, [currentUser]);

  useEffect(() => {
    if (expandedUserId) {
      loadUserKycDocs(expandedUserId);
    }
  }, [expandedUserId]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem' }}>🛡️</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '1rem' }}>{t('admin.access_restricted')}</h2>
        <p style={{ color: 'var(--text-secondary-light)', marginTop: '0.5rem', marginBottom: '2rem' }}>
          Vous devez être connecté avec un compte administrateur pour accéder à cet espace.
        </p>
      </div>
    );
  }

  const kpis = getKPIs();

  // Find all pending campaigns
  const pendingPetitions = petitions.filter(p => p.status === 'pending');
  const pendingCagnottes = cagnottes.filter(c => c.status === 'pending');

  const totalPending = pendingPetitions.length + pendingCagnottes.length;

  // Combine all publications for global management
  const allPublications = [
    ...petitions.map(p => ({
      id: p.id,
      type: 'petition' as const,
      title: p.title,
      authorName: p.organizer.name,
      status: p.status
    })),
    ...cagnottes.map(c => ({
      id: c.id,
      type: 'cagnotte' as const,
      title: c.title,
      authorName: c.organizer.name,
      status: c.status
    })),
    ...volunteerMissions.map(m => ({
      id: m.id,
      type: 'volunteer_mission' as const,
      title: m.title,
      authorName: typeof m.organizer === 'string' ? m.organizer : m.organizer?.name || 'Inconnu',
      status: m.status
    })),
    ...(tontines || []).map(t => ({
      id: t.id,
      type: 'tontine' as const,
      title: t.name,
      authorName: t.organizer?.name || 'Inconnu',
      status: t.status
    }))
  ];

  const filteredPublications = allPublications.filter(pub => {
    const matchesSearch = pub.title.toLowerCase().includes(publicationSearch.toLowerCase()) || 
                          pub.authorName.toLowerCase().includes(publicationSearch.toLowerCase());
    const matchesFilter = publicationFilter === 'all' || pub.type === publicationFilter;
    return matchesSearch && matchesFilter;
  });

  const handleToggleDossier = (id: string, type: 'petition' | 'cagnotte', viewedByAdmin?: boolean) => {
    if (expandedCampaignId === id) {
      setExpandedCampaignId(null);
    } else {
      setExpandedCampaignId(id);
      if (!viewedByAdmin) {
        markCampaignAsViewed(id, type);
      }
    }
  };

  // Render mock documents based on their name for validation
  const renderDocPreview = () => {
    if (!selectedDoc) return null;
    
    let docType = "Document Administratif";
    let docContent = (
      <div style={{ border: '1px dashed var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', background: 'rgba(0,0,0,0.01)' }}>
        <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📄</span>
        <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{selectedDoc}</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
          Aperçu scanné du document justificatif. Conforme au format réglementaire.
        </p>
      </div>
    );
    
    const docLower = selectedDoc.toLowerCase();
    if (docLower.includes('facture') || docLower.includes('devis') || docLower.includes('prestation') || docLower.includes('budget')) {
      docType = "Devis / Facture Proforma";
      docContent = (
        <div style={{ border: '1px solid #ccc', padding: '1rem', background: '#fafafa', fontFamily: 'monospace', fontSize: '0.75rem', color: '#333' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.85rem' }}>SENEGAL BTP & SERVICES RURAUX</div>
          <div style={{ textAlign: 'center', fontSize: '0.6rem', color: '#666', marginBottom: '1rem' }}>N° RC: SN.DKR.2024.B.542 - NINEA: 004128522</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <span><strong>Client :</strong> ONG Horizon / Village</span>
            <span><strong>Date :</strong> 25/05/2026</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#eee', borderBottom: '1px solid #ccc' }}>
                <th style={{ textAlign: 'left', padding: '4px' }}>Désignation</th>
                <th style={{ textAlign: 'center', padding: '4px' }}>Qte</th>
                <th style={{ textAlign: 'right', padding: '4px' }}>Total (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px' }}>Forage de 45 mètres (Louga)</td>
                <td style={{ textAlign: 'center', padding: '4px' }}>1</td>
                <td style={{ textAlign: 'right', padding: '4px' }}>2 800 000</td>
              </tr>
              <tr>
                <td style={{ padding: '4px' }}>Pompe immergée solaire + 4 panneaux</td>
                <td style={{ textAlign: 'center', padding: '4px' }}>1</td>
                <td style={{ textAlign: 'right', padding: '4px' }}>1 100 000</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '4px' }}>Tuyauteries, bornes et château 5000L</td>
                <td style={{ textAlign: 'center', padding: '4px' }}>1</td>
                <td style={{ textAlign: 'right', padding: '4px' }}>600 000</td>
              </tr>
              <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                <td colSpan={2} style={{ padding: '4px', textAlign: 'right' }}>NET A PAYER :</td>
                <td style={{ padding: '4px', textAlign: 'right' }}>4 500 000 FCFA</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', textAlign: 'center', border: '2px dashed #00853F', padding: '0.25rem', color: '#00853F', fontWeight: 'bold', transform: 'rotate(-2deg)' }}>
            ✓ DEVIS SIGNÉ - VALIDÉ POUR EXÉCUTION
          </div>
        </div>
      );
    } else if (docLower.includes('cni') || docLower.includes('identit') || docLower.includes('corte') || docLower.includes('piece') || docLower.includes('passeport')) {
      docType = "Pièce d'Identité Nationale (Sénégal)";
      docContent = (
        <div style={{ border: '2px solid #00853F', borderRadius: '8px', padding: '1rem', background: '#f0fbf5', color: '#111', maxWidth: '340px', margin: '0 auto', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #00853F', paddingBottom: '0.25rem', marginBottom: '0.75rem', fontSize: '0.65rem', fontWeight: 'bold' }}>
            <span>RÉPUBLIQUE DU SÉNÉGAL</span>
            <span>CARTE D'IDENTITÉ CEDEAO</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '75px', height: '95px', background: '#dcdfdc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👤</div>
            <div style={{ flex: 1, fontSize: '0.7rem', lineHeight: '1.4' }}>
              <div><strong>N° :</strong> 1 771 1993 00425</div>
              <div><strong>NOM :</strong> DIAW</div>
              <div><strong>PRÉNOM :</strong> Fatoumata</div>
              <div><strong>D.N. :</strong> 25/08/1993</div>
              <div><strong>LIEU :</strong> Louga, Sénégal</div>
              <div><strong>ADRESSE :</strong> Quartier Santhiaba, Louga</div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.6rem', color: 'green', fontWeight: 'bold' }}>● PROFIL VALIDÉ SUNU YITÉ</div>
            </div>
          </div>
          <div style={{ fontSize: '0.5rem', color: '#666', marginTop: '0.75rem', textAlign: 'right', borderTop: '1px dashed #ccc', paddingTop: '0.25rem' }}>
            Délivrée par la Direction de l'Automatisation des Fichiers
          </div>
        </div>
      );
    } else if (docLower.includes('attestation') || docLower.includes('bail') || docLower.includes('accord') || docLower.includes('autorisation')) {
      docType = "Autorisation Administrative Municipale";
      docContent = (
        <div style={{ border: '1px solid #b5a4a4', padding: '1.5rem', background: '#fffefb', color: '#2b2b2b', fontSize: '0.75rem', lineHeight: '1.6', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '0.6rem', color: '#666' }}>
            <span>COMMUNE DE BARKEDJI</span>
            <span>RÉGION DE LOUGA</span>
          </div>
          <h4 style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '1rem', fontSize: '0.85rem' }}>
            ATTESTATION D'AUTORISATION DE FORAGE PUBLIC
          </h4>
          <p>Le Maire de la Commune de Barkedji atteste par la présente avoir délivré un accord de principe à l'association de développement local représentée par Monsieur <strong>Amady Ndiaye</strong> pour l'implantation d'un forage d'eau potable solaire sur le terrain communautaire enregistré sous le lot N° 45.</p>
          <p style={{ marginTop: '0.5rem' }}>Les travaux devront respecter les normes hydrologiques en vigueur.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.65rem' }}>
            <span>Fait à Barkedji, le 12/05/2026</span>
            <div style={{ textAlign: 'center', minWidth: '100px' }}>
              <span>Le Maire Communal</span>
              <div style={{ border: '1px dashed #ef4444', borderRadius: '4px', padding: '0.2rem', color: '#ef4444', transform: 'rotate(-5deg)', fontWeight: 'bold', fontSize: '0.55rem', marginTop: '0.25rem', textAlign: 'center' }}>
                MAIRIE DE BARKEDJI<br/>[ APPROUVÉ ]
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => setSelectedDoc(null)}
      >
        <div 
          className="glass animate-fade-in"
          style={{
            maxWidth: '480px',
            width: '100%',
            background: 'var(--light-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-lg)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--primary)' }}>📄 Instruction : {docType}</h3>
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ padding: '0.25rem', fontSize: '1.1rem', minWidth: 'auto', color: 'var(--text-primary-light)' }}
              onClick={() => setSelectedDoc(null)}
            >
              ✕
            </button>
          </div>
          <div style={{ margin: '1rem 0' }}>
            {docContent}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              onClick={() => setSelectedDoc(null)}
            >
              Fermer la pièce
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render photo lightbox
  const renderLightbox = () => {
    if (!selectedImage) return null;
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}
        onClick={() => setSelectedImage(null)}
      >
        <button 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '1.5rem', padding: '0.5rem 0.8rem', borderRadius: '50%', cursor: 'pointer' }}
          onClick={() => setSelectedImage(null)}
        >
          ✕
        </button>
        <img 
          src={selectedImage} 
          alt="Visualisation Galerie" 
          style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '3px solid white' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  return (
    <>
      <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Espace Administration</h1>
      <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Modération des contenus, suivi des transactions financières et administration générale de la plateforme Sunu Yité.
      </p>

      {/* ADMIN LEVEL METRICS */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>📊 KPIs Globaux de la plateforme</h2>
        <div className="grid-cols-4">
          <div className="premium-card">
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Volume de Transactions</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {kpis.totalDonations.toLocaleString('fr-FR')} F
              </h3>
            </div>
          </div>

          <div className="premium-card">
            <span style={{ fontSize: '1.5rem' }}>📈</span>
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Commissions (4% Moy.)</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {kpis.totalCommissions.toLocaleString('fr-FR')} F
              </h3>
            </div>
          </div>

          <div className="premium-card">
            <span style={{ fontSize: '1.5rem' }}>👤</span>
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>{t('admin.kpi.registered_members')}</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {kpis.totalUsers}
              </h3>
            </div>
          </div>

          <div className="premium-card">
            <span style={{ fontSize: '1.5rem' }}>🔔</span>
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>Campagnes Actives</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {kpis.activeCampaigns}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* MODERATION QUEUE */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          ⚖️ File de modération ({totalPending} campagne(s) en attente)
        </h2>

        {totalPending === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--light-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontWeight: 600 }}>{t('admin.moderated_all')}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
              Aucune pétition ou cagnotte n'est en attente de vérification administrative.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Pending Petitions */}
            {pendingPetitions.map((p) => {
              const organizerDetails = usersList.find(u => u.id === p.organizer.id);
              const isExpanded = expandedCampaignId === p.id;
              
              return (
                <div 
                  key={p.id} 
                  className="premium-card" 
                  style={{ 
                    background: 'var(--light-card)', 
                    borderLeft: '4px solid var(--primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '1.5rem'
                  }}
                >
                  {/* Top Header Summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                          PÉTITION
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          Soumis le {p.createdAt} par <strong>{p.organizer.name}</strong>
                        </span>
                        {!p.viewedByAdmin && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--info)', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }}></span> Nouveau
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{p.title}</h3>
                      {!isExpanded && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => handleToggleDossier(p.id, 'petition', p.viewedByAdmin)}
                      >
                        {isExpanded ? '📁 Fermer le dossier' : '📁 Ouvrir le dossier'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Complete Dossier */}
                  {isExpanded && (
                    <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Campaign Image Banner */}
                      {p.coverImage && (
                        <div style={{ position: 'relative', height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundImage: `url(${p.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color: 'white' }}>
                            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>📍 Lieu d'impact : <strong>{p.location}</strong> | Destinataire : <strong>{p.recipient}</strong></span>
                          </div>
                        </div>
                      )}

                      {/* Organizer dossier folder info */}
                      <div style={{ background: 'rgba(0,133,63,0.03)', border: '1px solid rgba(0,133,63,0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          👤 Dossier Auteur de la Pétition
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <img src={organizerDetails?.avatar || p.organizer.avatar} alt={p.organizer.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <h5 style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                              {p.organizer.name} {p.organizer.verified && <span style={{ color: 'var(--primary)' }}>✓</span>}
                            </h5>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                              <span>📧 <strong>Email :</strong> {organizerDetails?.email || 'Non renseigné'}</span>
                              <span>📞 <strong>{t('admin.phone_label')}</strong> {organizerDetails?.phone || 'Non renseigné'}</span>
                              <span>📍 <strong>{t('admin.region_label')}</strong> {organizerDetails?.region || 'Non renseignée'}</span>
                            </div>
                          </div>
                          <div>
                            <TrustScore score={organizerDetails?.trustScore || p.organizer.trustScore} />
                          </div>
                        </div>
                      </div>

                      {/* Full details letter text */}
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('admin.description_grievance')}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary-light)', whiteSpace: 'pre-wrap', lineHeight: '1.6', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                          {p.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary-light)', borderTop: '1px dashed var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <span>Objectif de signatures : <strong>{p.signaturesTarget.toLocaleString('fr-FR')} signatures</strong></span>
                        <span>Date limite : <strong>{p.dateLimit}</strong></span>
                      </div>

                      {/* Rejection input field */}
                      {rejectingCampaignId === p.id && (
                        <div className="animate-slide-up" style={{ background: 'rgba(239,68,68,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--danger)' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                            Motif de refus / retours de correction requis :
                          </label>
                          <textarea
                            rows={3}
                            placeholder={t('admin.blocking_explanation')}
                            className="premium-card"
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', background: 'white', resize: 'none', marginBottom: '0.75rem' }}
                            value={rejectionFeedback}
                            onChange={(e) => setRejectionFeedback(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              className="btn btn-ghost" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
                              onClick={() => { setRejectingCampaignId(null); setRejectionFeedback(''); }}
                            >
                              Annuler
                            </button>
                            <button 
                              type="button" 
                              className="btn" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--danger)', color: 'white' }} 
                              onClick={() => {
                                if (rejectionFeedback.trim() === '') {
                                  alert('Veuillez saisir un motif de rejet.');
                                  return;
                                }
                                rejectCampaign(p.id, 'petition', rejectionFeedback);
                                setRejectingCampaignId(null);
                                setRejectionFeedback('');
                                setExpandedCampaignId(null);
                              }}
                            >
                              Confirmer le refus
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Main decision action buttons at bottom of folder */}
                      {rejectingCampaignId !== p.id && (
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => { setRejectingCampaignId(p.id); setRejectionFeedback(''); }}
                          >
                            ✕ Rejeter la pétition
                          </button>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                            onClick={() => {
                              approveCampaign(p.id, 'petition');
                              setExpandedCampaignId(null);
                            }}
                          >
                            ✓ Approuver & Publier
                          </button>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}

            {/* Pending Cagnottes */}
            {pendingCagnottes.map((c) => {
              const organizerDetails = usersList.find(u => u.id === c.organizer.id);
              const isExpanded = expandedCampaignId === c.id;

              return (
                <div 
                  key={c.id} 
                  className="premium-card" 
                  style={{ 
                    background: 'var(--light-card)', 
                    borderLeft: '4px solid var(--secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '1.5rem'
                  }}
                >
                  {/* Top Header Summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(252,209,22,0.2)', color: 'var(--secondary-dark)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                          CAGNOTTE
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          Cible : <strong>{c.amountTarget.toLocaleString('fr-FR')} F</strong> | Soumis par <strong>{c.organizer.name}</strong>
                        </span>
                        {!c.viewedByAdmin && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--info)', color: 'white', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white' }}></span> Nouveau
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{c.title}</h3>
                      {!isExpanded && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.description}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => handleToggleDossier(c.id, 'cagnotte', c.viewedByAdmin)}
                      >
                        {isExpanded ? '📁 Fermer le dossier' : '📁 Ouvrir le dossier'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Complete Dossier */}
                  {isExpanded && (
                    <div className="animate-fade-in" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Campaign Image Banner */}
                      {c.coverImage && (
                        <div style={{ position: 'relative', height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundImage: `url(${c.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color: 'white' }}>
                            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>📍 Zone d'impact : <strong>{c.location}</strong> | Cible Diaspora : <strong>{c.isDiasporaTargeted ? 'Oui' : 'Non'}</strong></span>
                          </div>
                        </div>
                      )}

                      {/* Organizer dossier folder info */}
                      <div style={{ background: 'rgba(252,209,22,0.03)', border: '1px solid rgba(252,209,22,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--secondary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          👤 Dossier Auteur du Lancement Cagnotte
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <img src={organizerDetails?.avatar || c.organizer.avatar} alt={c.organizer.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <h5 style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                              {c.organizer.name} {c.organizer.verified && <span style={{ color: 'var(--primary)' }}>✓</span>}
                            </h5>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                              <span>📧 <strong>Email :</strong> {organizerDetails?.email || 'Non renseigné'}</span>
                              <span>📞 <strong>Tél :</strong> {organizerDetails?.phone || 'Non renseigné'}</span>
                              <span>📍 <strong>Région :</strong> {organizerDetails?.region || 'Non renseignée'}</span>
                            </div>
                          </div>
                          <div>
                            <TrustScore score={organizerDetails?.trustScore || c.organizer.trustScore} />
                          </div>
                        </div>
                      </div>

                      {/* Full details text */}
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>📝 Descriptif du projet & Justification sociale :</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary-light)', whiteSpace: 'pre-wrap', lineHeight: '1.6', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                          {c.description}
                        </p>
                      </div>

                      {/* Documents justificatifs officiels list */}
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>📄 Documents Justificatifs Officiels (CNI, Devis, Autorisations) :</h4>
                        {(!c.documents || c.documents.length === 0) ? (
                          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold', padding: '0.6rem 1rem', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--danger)' }}>
                            ⚠️ Aucun document justificatif officiel (CNI, devis, statuts d'association) n'a été transmis pour ce projet !
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {c.documents.map((doc, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--light)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary-light)' }}>
                                  📎 {doc}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}
                                    onClick={() => setSelectedDoc(doc)}
                                  >
                                    👁️ Visualiser
                                  </button>
                                  <a 
                                    href={`#download_${doc}`} 
                                    className="btn btn-outline" 
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                    onClick={(e) => { e.preventDefault(); alert(`Téléchargement simulé de ${doc}`); }}
                                  >
                                    📥 Télécharger
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Image Gallery */}
                      <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.5rem' }}>{t('admin.complementary_gallery')}</h4>
                        {(!c.gallery || c.gallery.length === 0) ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', fontStyle: 'italic' }}>{t('admin.no_terrain_photos')}</p>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.75rem' }}>
                            {c.gallery.map((img, idx) => (
                              <div 
                                key={idx} 
                                style={{ position: 'relative', paddingBottom: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)', cursor: 'pointer' }}
                                onClick={() => setSelectedImage(img)}
                              >
                                <img 
                                  src={img} 
                                  alt={`Galerie ${idx}`} 
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rejection input field */}
                      {rejectingCampaignId === c.id && (
                        <div className="animate-slide-up" style={{ background: 'rgba(239,68,68,0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--danger)' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                            Motif de refus / pièces justificatives manquantes :
                          </label>
                          <textarea
                            rows={3}
                            placeholder={t('admin.missing_justificative_explanation')}
                            className="premium-card"
                            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', background: 'white', resize: 'none', marginBottom: '0.75rem' }}
                            value={rejectionFeedback}
                            onChange={(e) => setRejectionFeedback(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              className="btn btn-ghost" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} 
                              onClick={() => { setRejectingCampaignId(null); setRejectionFeedback(''); }}
                            >
                              Annuler
                            </button>
                            <button 
                              type="button" 
                              className="btn" 
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--danger)', color: 'white' }} 
                              onClick={() => {
                                if (rejectionFeedback.trim() === '') {
                                  alert('Veuillez saisir un motif de rejet.');
                                  return;
                                }
                                rejectCampaign(c.id, 'cagnotte', rejectionFeedback);
                                setRejectingCampaignId(null);
                                setRejectionFeedback('');
                                setExpandedCampaignId(null);
                              }}
                            >
                              Confirmer le refus
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Main decision action buttons at bottom of folder */}
                      {rejectingCampaignId !== c.id && (
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => { setRejectingCampaignId(c.id); setRejectionFeedback(''); }}
                          >
                            ✕ Rejeter la cagnotte
                          </button>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                            onClick={() => {
                              approveCampaign(c.id, 'cagnotte');
                              setExpandedCampaignId(null);
                            }}
                          >
                            ✓ Valider & Activer
                          </button>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* WITHDRAWAL REQUESTS MODERATION */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          💸 Modération des Retraits ({(withdrawalRequests || []).filter(w => w.status === 'pending').length} en attente)
        </h2>

        {(withdrawalRequests || []).filter(w => w.status === 'pending').length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--light-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Aucune demande de retrait en attente</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginTop: '0.25rem' }}>
              Toutes les demandes de transfert de fonds ont été traitées.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {(withdrawalRequests || []).filter(w => w.status === 'pending').map((req) => {
              const reqUser = usersList.find(u => u.id === req.userId);
              return (
                <div 
                  key={req.id} 
                  className="premium-card" 
                  style={{ 
                    background: 'var(--light-card)', 
                    borderLeft: '4px solid var(--primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1.25rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>
                        Demande du {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        ⏳ En attente
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <img 
                        src={reqUser?.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='} 
                        alt={reqUser?.name} 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                      <div>
                        <strong style={{ fontSize: '0.9rem', display: 'block' }}>{reqUser?.name || 'Utilisateur Inconnu'}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                          Solde: {(reqUser?.availableFunds || 0).toLocaleString('fr-FR')} F disponible(s)
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Montant :</span>
                        <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{req.amount.toLocaleString('fr-FR')} FCFA</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>Méthode :</span>
                        <strong style={{ fontSize: '0.8rem' }}>{req.method} ({req.phone})</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={async () => {
                        if (window.confirm(`Voulez-vous rejeter cette demande de retrait de ${req.amount.toLocaleString('fr-FR')} F ? Le solde sera recrédité.`)) {
                          await rejectWithdrawalRequest(req.id);
                        }
                      }}
                    >
                      ✕ Rejeter
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                      onClick={async () => {
                        if (window.confirm(`Voulez-vous approuver cette demande de retrait de ${req.amount.toLocaleString('fr-FR')} F via ${req.method} ?`)) {
                          await approveWithdrawalRequest(req.id);
                        }
                      }}
                    >
                      ✓ Approuver
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Past Withdrawals Log */}
        {(withdrawalRequests || []).filter(w => w.status !== 'pending').length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-secondary-light)' }}>
              Historique des demandes traitées
            </h4>
            <div className="premium-card" style={{ padding: 0, overflowX: 'auto', background: 'var(--light-card)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--light)', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '0.5rem 1rem' }}>Utilisateur</th>
                    <th style={{ padding: '0.5rem 1rem' }}>Montant</th>
                    <th style={{ padding: '0.5rem 1rem' }}>Méthode</th>
                    <th style={{ padding: '0.5rem 1rem' }}>Statut</th>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(withdrawalRequests || []).filter(w => w.status !== 'pending').map((req) => {
                    const reqUser = usersList.find(u => u.id === req.userId);
                    const statusColor = req.status === 'approved' ? 'var(--success)' : 'var(--danger)';
                    const statusLabel = req.status === 'approved' ? '✓ Approuvé' : '✕ Rejeté';
                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>{reqUser?.name || 'Inconnu'}</td>
                        <td style={{ padding: '0.5rem 1rem', fontWeight: 'bold' }}>{req.amount.toLocaleString('fr-FR')} F</td>
                        <td style={{ padding: '0.5rem 1rem' }}>{req.method} ({req.phone})</td>
                        <td style={{ padding: '0.5rem 1rem', color: statusColor, fontWeight: 'bold' }}>{statusLabel}</td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--text-secondary-light)' }}>
                          {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* GLOBAL PUBLICATIONS MANAGEMENT PANEL */}

      {/* GLOBAL PUBLICATIONS MANAGEMENT PANEL */}
      <section style={{ marginTop: '3rem', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>
          📂 Gestion Globale des Publications ({petitions.length + cagnottes.length + volunteerMissions.length} publications)
        </h2>
        <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Recherchez et supprimez définitivement n'importe quelle publication (pétition, cagnotte ou mission de bénévolat) de la plateforme.
        </p>

        {/* Search and filter toolbar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: '1rem', 
          marginBottom: '1.5rem', 
          flexWrap: 'wrap', 
          background: 'var(--light-card)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}>
          <input 
            type="text" 
            placeholder="🔍 Rechercher par titre ou auteur..." 
            className="premium-card" 
            style={{ 
              flex: 1, 
              minWidth: '200px', 
              padding: '0.5rem 1rem', 
              fontSize: '0.85rem', 
              background: 'var(--light)',
              borderRadius: 'var(--radius-sm)'
            }}
            value={publicationSearch}
            onChange={(e) => setPublicationSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'petition', 'cagnotte', 'volunteer_mission', 'tontine'] as const).map((type) => {
              const label = type === 'all' ? 'Toutes' : type === 'petition' ? 'Pétitions' : type === 'cagnotte' ? 'Cagnottes' : type === 'volunteer_mission' ? 'Projets en commun' : 'Tontines';
              const isActive = publicationFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={isActive ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setPublicationFilter(type)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Publications list table */}
        {filteredPublications.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '2rem', background: 'var(--light-card)' }}>
            <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: 0 }}>
              Aucune publication ne correspond à votre recherche ou filtre.
            </p>
          </div>
        ) : (
          <div className="premium-card animate-fade-in" style={{ padding: 0, overflowX: 'auto', background: 'var(--light-card)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--light)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Titre</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Auteur</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>Statut</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPublications.map((pub) => {
                  const typeLabel = pub.type === 'petition' ? '📝 Pétition' : pub.type === 'cagnotte' ? '💰 Cagnotte' : pub.type === 'tontine' ? '🔄 Tontine' : '🤝 Projets en commun';
                  const statusLabel = pub.status === 'active' ? '● Actif' : pub.status === 'pending' ? '● En attente' : pub.status === 'rejected' ? '● Rejeté' : pub.status === 'completed' ? '● Terminé' : pub.status;
                  const statusColor = pub.status === 'active' ? 'var(--success)' : pub.status === 'pending' ? 'var(--warning)' : pub.status === 'rejected' ? 'var(--danger)' : 'var(--text-secondary-light)';
                  
                  return (
                    <tr key={pub.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>{typeLabel}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{pub.title}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary-light)' }}>{pub.authorName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: statusColor, fontWeight: 'bold' }}>{statusLabel}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ 
                            padding: '0.35rem 0.75rem', 
                            fontSize: '0.75rem', 
                            background: 'rgba(239,68,68,0.1)', 
                            color: 'var(--danger)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          onClick={async () => {
                            if (window.confirm(`⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer définitivement la publication "${pub.title}" ? Cette action est irréversible et supprimera toutes les données associées.`)) {
                              await deletePublication(pub.id, pub.type);
                            }
                          }}
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* USER LIST & KYC AUDIT PANEL */}
      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>{t('admin.users_directory')}</h2>
        <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Inspectez les dossiers de certification d'identité biométrique (Recto/Verso CNI et Selfies), modifiez les rôles des visiteurs et ajustez les indices de confiance.
        </p>

        {/* KYC filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(['pending', 'verified', 'rejected', 'all'] as const).map((filter) => {
            const label = filter === 'pending' ? '⏳ En attente KYC' : filter === 'verified' ? '🛡️ Certifiés' : filter === 'rejected' ? '❌ Rejetés' : '👥 Tous';
            const isActive = kycFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                className={isActive ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                onClick={() => setKycFilter(filter)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {usersList.filter(user => {
            if (kycFilter === 'all') return true;
            return user.verificationStatus === kycFilter;
          }).map((user) => {
            const isActive = currentUser.id === user.id;
            const isUserExpanded = expandedUserId === user.id;
            
            // Get verification badge styling
            const getStatusBadge = (status?: string) => {
              switch (status) {
                case 'verified':
                  return <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', fontWeight: 'bold' }}>{t('admin.status_verified')}</span>;
                case 'pending':
                  return <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', fontWeight: 'bold' }}>⏳ En attente</span>;
                case 'rejected':
                  return (
                    <span 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontWeight: 'bold' }}
                      title={user.kycRejectReason}
                    >
                      {t('admin.status_rejected')} {user.kycRejectReason ? `(${user.kycRejectReason})` : ''}
                    </span>
                  );
                default:
                  return <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', borderRadius: '4px', background: 'rgba(156,163,175,0.1)', color: 'var(--text-secondary-light)' }}>Aucun</span>;
              }
            };

            return (
              <div 
                key={user.id} 
                className="premium-card" 
                style={{ 
                  border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: isActive ? 'rgba(0,133,63,0.01)' : 'var(--light-card)',
                  padding: '1.25rem'
                }}
              >
                {/* Summary View */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div 
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%', 
                        backgroundImage: `url("${user.avatar || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2ExYTFhYSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='}")`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1.5px solid var(--border-light)'
                      }} 
                    />
                    
                    <div>
                      <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {user.name} {user.verified && <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>✓</span>}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary-light)' }}>
                          Rôle : <strong>{user.role}</strong>
                        </span>
                        <span style={{ color: '#d1d5db' }}>|</span>
                        <span style={{ color: 'var(--text-secondary-light)' }}>
                          Score: <strong>{user.trustScore}%</strong>
                        </span>
                        <span style={{ color: '#d1d5db' }}>|</span>
                        <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          KYC: {getStatusBadge(user.verificationStatus)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                      onClick={() => setExpandedUserId(isUserExpanded ? null : user.id)}
                    >
                      {isUserExpanded ? '▲ Réduire' : '🔍 Inspecter & KYC'}
                    </button>

                    {isActive ? (
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', padding: '0.4rem' }}>
                        ● ACTIF
                      </span>
                    ) : (
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}
                        onClick={() => {
                          setCurrentUser(user);
                          alert(`Changement d'utilisateur : Vous simulez maintenant ${user.name} (${user.role}).`);
                        }}
                      >
                        Simuler ce profil
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded KYC Document Review and Action Panel */}
                {isUserExpanded && (
                  <div 
                    className="animate-fade-in"
                    style={{ 
                      marginTop: '1.25rem', 
                      paddingTop: '1.25rem', 
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem'
                    }}
                  >
                    {/* Identification Data Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block' }}>Email</span>
                        <strong style={{ fontSize: '0.85rem' }}>{user.email}</strong>
                      </div>
                      <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block' }}>{t('auth.phone_label')}</span>
                        <strong style={{ fontSize: '0.85rem' }}>{user.phone || 'Non renseigné'}</strong>
                      </div>
                      <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block' }}>Numéro CNI / Passeport</span>
                        <strong style={{ fontSize: '0.85rem', color: user.cniNumber ? 'inherit' : 'var(--text-secondary-light)' }}>
                          {user.cniNumber || 'Non renseigné'}
                        </strong>
                      </div>
                      <div style={{ background: 'var(--light)', padding: '0.75rem', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)', display: 'block' }}>Date de Naissance</span>
                        <strong style={{ fontSize: '0.85rem', color: user.dob ? 'inherit' : 'var(--text-secondary-light)' }}>
                          {user.dob || 'Non renseigné'}
                        </strong>
                      </div>
                    </div>

                    {/* Document Previews Section */}
                    <div>
                      <h5 style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{t('admin.documents_uploaded')}</h5>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {/* Recto */}
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', background: '#fafafa', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', padding: '0.35rem', background: '#eee', fontWeight: 600 }}>CNI - Recto</span>
                          {user.idCardRecto ? (
                            <img 
                              src={user.idCardRecto} 
                              alt="CNI Recto" 
                              style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'zoom-in' }} 
                              onClick={() => setSelectedImage(user.idCardRecto || null)}
                            />
                          ) : (
                            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#ccc' }}>💳</div>
                          )}
                        </div>

                        {/* Verso */}
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', background: '#fafafa', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', padding: '0.35rem', background: '#eee', fontWeight: 600 }}>CNI - Verso</span>
                          {user.idCardVerso ? (
                            <img 
                              src={user.idCardVerso} 
                              alt="CNI Verso" 
                              style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'zoom-in' }} 
                              onClick={() => setSelectedImage(user.idCardVerso || null)}
                            />
                          ) : (
                            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#ccc' }}>💳</div>
                          )}
                        </div>

                        {/* Selfie */}
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: '6px', overflow: 'hidden', background: '#fafafa', textAlign: 'center' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', padding: '0.35rem', background: '#eee', fontWeight: 600 }}>{t('admin.selfie_control')}</span>
                          {user.selfie ? (
                            <img 
                              src={user.selfie} 
                              alt="Selfie" 
                              style={{ width: '100%', height: '100px', objectFit: 'cover', cursor: 'zoom-in' }} 
                              onClick={() => setSelectedImage(user.selfie || null)}
                            />
                          ) : (
                            <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#ccc' }}>👤</div>
                          )}
                        </div>
                      </div>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary-light)', marginTop: '0.4rem' }}>
                        💡 Astuce : Cliquez sur une photo pour l'agrandir en haute définition.
                      </span>
                    </div>

                    {/* Admin Actions (KYC Approval / Role Change / Trust Edit) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                      
                      {/* KYC Validation buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary-light)' }}>{t('admin.identity_moderation')}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                            disabled={user.verificationStatus === 'verified'}
                            onClick={() => {
                              adminUpdateUser(user.id, { 
                                verificationStatus: 'verified', 
                                verified: true, 
                                trustScore: 100 
                              });
                            }}
                          >
                            ✓ Approuver KYC & Certifier
                          </button>
                          
                          {rejectingUserId === user.id ? (
                            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(239,68,68,0.05)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--danger)', width: '280px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                                Motif du rejet du KYC :
                              </label>
                              <textarea
                                rows={2}
                                placeholder="Indiquez le motif (ex: documents illisibles...)"
                                className="premium-card"
                                style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', background: 'white', resize: 'none' }}
                                value={kycRejectReasonText}
                                onChange={(e) => setKycRejectReasonText(e.target.value)}
                              />
                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                <button 
                                  type="button" 
                                  className="btn btn-ghost" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', minWidth: 'auto' }} 
                                  onClick={() => { setRejectingUserId(null); setKycRejectReasonText(''); }}
                                >
                                  Annuler
                                </button>
                                <button 
                                  type="button" 
                                  className="btn" 
                                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', background: 'var(--danger)', color: 'white', minWidth: 'auto' }} 
                                  onClick={async () => {
                                    if (kycRejectReasonText.trim() === '') {
                                      alert('Veuillez saisir un motif de rejet.');
                                      return;
                                    }
                                    await adminUpdateUser(user.id, { 
                                      verificationStatus: 'rejected', 
                                      verified: false,
                                      trustScore: 50,
                                      kycRejectReason: kycRejectReasonText
                                    });
                                    setRejectingUserId(null);
                                    setKycRejectReasonText('');
                                    setExpandedUserId(null);
                                  }}
                                >
                                  Confirmer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                              disabled={user.verificationStatus === 'rejected'}
                              onClick={() => {
                                setRejectingUserId(user.id);
                                setKycRejectReasonText('');
                              }}
                            >
                              ✕ Rejeter KYC
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Role updates */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label htmlFor={`role-select-${user.id}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary-light)' }}>{t('admin.platform_role')}</label>
                        <select
                          id={`role-select-${user.id}`}
                          className="premium-card"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: '150px' }}
                          value={user.role}
                          onChange={(e: any) => {
                            adminUpdateUser(user.id, { role: e.target.value });
                          }}
                        >
                          <option value="citizen">Citoyen (citizen)</option>
                          <option value="organizer">Organisateur (organizer)</option>
                          <option value="admin">Administrateur (admin)</option>
                        </select>
                      </div>

                      {/* Trust score adjustment slider */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: '1', minWidth: '150px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary-light)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Ajuster Trust Score</span>
                          <strong>{user.trustScore}%</strong>
                        </span>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={user.trustScore}
                          onChange={(e) => {
                            adminUpdateUser(user.id, { trustScore: Number(e.target.value) });
                          }}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer', height: '6px' }}
                        />
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. CONTACT MESSAGES PANEL */}
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem' }}>{t('admin.received_messages')}</h2>
        
        {messagesLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement des messages...</div>
        ) : contactMessages.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '2rem', background: 'var(--light-card)' }}>
            <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-secondary-light)', margin: 0 }}>
              Aucun message de contact reçu pour le moment.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {contactMessages.map((msg) => (
              <div 
                key={msg.id} 
                className="premium-card" 
                style={{ 
                  background: 'var(--light-card)', 
                  borderLeft: '4px solid var(--primary)', 
                  padding: '1.25rem',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', display: 'block' }}>👤 {msg.name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
                      📧 {msg.email} {msg.phone && `| 📱 ${msg.phone}`}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,133,63,0.1)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', display: 'inline-block', marginBottom: '0.25rem' }}>
                      Objet : {msg.subject}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary-light)' }}>
                      {new Date(msg.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#444', whiteSpace: 'pre-line', margin: 0, lineHeight: 1.5 }}>
                  {msg.message}
                </p>
                {(() => {
                  const senderUser = usersList.find(u => u.email.toLowerCase() === msg.email.toLowerCase());
                  return (
                    <>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary-light)', borderTop: '1px dashed var(--border-light)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{t('admin.configured_recipient')}<strong>{msg.recipient}</strong></span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {senderUser && (
                            <button 
                              type="button"
                              className="btn btn-primary" 
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', minWidth: 'auto' }}
                              onClick={() => {
                                setReplyingMessageId(replyingMessageId === msg.id ? null : msg.id);
                                setDirectReplyText('');
                              }}
                            >
                              💬 Répondre (Messagerie Citoyenne)
                            </button>
                          )}
                          <a href={`mailto:${msg.email}?subject=Re: [Sama Cause] ${msg.subject}`} className="btn btn-outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', textDecoration: 'none', minWidth: 'auto' }}>
                            ✉️ Répondre par email
                          </a>
                        </div>
                      </div>

                      {replyingMessageId === msg.id && senderUser && (
                        <div className="animate-slide-up" style={{ marginTop: '0.75rem', background: 'rgba(0,133,63,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            Votre réponse à {senderUser.name} :
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Saisissez votre message direct..."
                            className="premium-card"
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', background: 'white', resize: 'none', marginBottom: '0.5rem' }}
                            value={directReplyText}
                            onChange={(e) => setDirectReplyText(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              className="btn btn-ghost" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto' }}
                              onClick={() => { setReplyingMessageId(null); setDirectReplyText(''); }}
                            >
                              Annuler
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-primary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: 'auto' }}
                              onClick={async () => {
                                if (directReplyText.trim() === '') {
                                  alert('Veuillez saisir un message.');
                                  return;
                                }
                                await sendDirectMessage(senderUser.id, directReplyText);
                                alert('Message envoyé avec succès dans la messagerie citoyenne !');
                                setReplyingMessageId(null);
                                setDirectReplyText('');
                              }}
                            >
                              Envoyer le message
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </section>

      </div>

      {/* Render modals */}
      {renderDocPreview()}
      {renderLightbox()}
    </>
  );
};
