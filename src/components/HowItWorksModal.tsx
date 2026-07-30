import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { isMobileView } = useApp();
  const [activeTab, setActiveTab] = useState<'fonctionnement' | 'avantages' | 'faq'>('fonctionnement');

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 2500,
        display: 'flex',
        alignItems: isMobileView ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobileView ? 0 : '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="glass animate-fade-in animate-slide-up"
        style={{
          maxWidth: '650px',
          width: '100%',
          maxHeight: isMobileView ? '88vh' : '90vh',
          overflowY: 'auto',
          background: 'var(--light-card)',
          borderRadius: isMobileView ? '24px 24px 0 0' : 'var(--radius-lg)',
          border: '1.5px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Header */}
        <div 
          style={{
            height: '110px',
            background: 'linear-gradient(135deg, #00853f 0%, #006830 50%, #fcd116 100%)',
            position: 'relative',
            padding: '1.25rem',
            borderRadius: isMobileView ? '24px 24px 0 0' : 'var(--radius-lg) var(--radius-lg) 0 0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.5px' }}>
              🇸🇳 Guide Complet Sunu Yité
            </span>
            <h2 style={{ fontSize: isMobileView ? '1.2rem' : '1.4rem', fontWeight: 800, color: 'white', margin: '0.2rem 0 0 0' }}>
              Comment ça fonctionne & Avantages
            </h2>
          </div>

          <button 
            style={{
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
            title="Fermer le guide"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: isMobileView ? '1.25rem' : '1.75rem' }}>
          {/* Segmented Control Switcher */}
          <div 
            style={{ 
              display: 'flex', 
              background: 'rgba(0,0,0,0.04)', 
              padding: '0.25rem', 
              borderRadius: 'var(--radius-md)', 
              marginBottom: '1.5rem',
              gap: '0.25rem'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('fonctionnement')}
              style={{
                flex: 1,
                padding: '0.6rem 0.5rem',
                fontWeight: activeTab === 'fonctionnement' ? 800 : 600,
                fontSize: isMobileView ? '0.78rem' : '0.85rem',
                background: activeTab === 'fonctionnement' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeTab === 'fonctionnement' ? 'var(--primary)' : 'var(--text-secondary-light)',
                boxShadow: activeTab === 'fonctionnement' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ⚙️ Fonctionnement
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('avantages')}
              style={{
                flex: 1,
                padding: '0.6rem 0.5rem',
                fontWeight: activeTab === 'avantages' ? 800 : 600,
                fontSize: isMobileView ? '0.78rem' : '0.85rem',
                background: activeTab === 'avantages' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeTab === 'avantages' ? 'var(--primary)' : 'var(--text-secondary-light)',
                boxShadow: activeTab === 'avantages' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🌟 Nos Avantages
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              style={{
                flex: 1,
                padding: '0.6rem 0.5rem',
                fontWeight: activeTab === 'faq' ? 800 : 600,
                fontSize: isMobileView ? '0.78rem' : '0.85rem',
                background: activeTab === 'faq' ? 'white' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: activeTab === 'faq' ? 'var(--primary)' : 'var(--text-secondary-light)',
                boxShadow: activeTab === 'faq' ? 'var(--shadow-sm)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              ❓ Questions (FAQ)
            </button>
          </div>

          {/* TAB 1: FONCTIONNEMENT */}
          {activeTab === 'fonctionnement' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>✍️</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    1. Pétitions & Mobilisation Citoyenne
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Lancez ou signez des doléances collectives. Chaque signature est sécurisée et authentifiée par code OTP SMS pour éviter les faux comptes. Une fois l'objectif atteint, la pétition est soumise officiellement aux autorités et décideurs concernés.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🪙</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    2. Cagnottes Solidaires & Financement
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Financez des réalisations concrètes au Sénégal (forages d'eau potable, rénovation d'écoles, achat d'ambulances, secours d'urgence). Effectuez vos dons directement en Francs CFA via Wave, Orange Money, Free Money ou carte bancaire international.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🪙</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    3. Tontines Éducatives & Épargne Communautaire
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Rejoignez ou créez une tontine en groupe. Épargnez ensemble, suivez les cotisations mensuelles de chaque membre en toute transparence et recevez vos versements en direct sur votre compte mobile.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🌍</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    4. Diaspora & Projets en Commun
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Connectez les compétences de la Diaspora avec les besoins locaux au Sénégal. Participez aux missions de bénévolat sur le terrain et suivez les projets solidaires région par région sur la carte interactive.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AVANTAGES */}
          {activeTab === 'avantages' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    Sécurité & Vérification Biométrique (KYC CNI)
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Chaque créateur de cagnotte ou organisateur de tontine est rigoureusement certifié par pièce d'identité CNI ou Passeport. Sunu Yité garantit 0% d'escroquerie et un environnement de confiance citoyenne.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>📜</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--secondary-dark)' }}>
                    Transparence Financière & Preuves d'Impact
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Chaque centime dépensé sur une cagnotte fait l'objet d'un reçu justificatif public et de photos Avant / Après. Vous pouvez télécharger la facture officielle de chaque don à tout moment.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid #3b82f6', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>📲</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#3b82f6' }}>
                    Multi-Paiement Mobile Local & International
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Payer n'a jamais été aussi simple : intégrez en 1 clic vos comptes Wave, Orange Money Sénégal, Free Money ou Cartes Visa/Mastercard sans aucun frais caché pour les contributeurs.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>🦁</span>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    Lamine IA : Assistant Intelligent Dédié
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary-light)', lineHeight: '1.5' }}>
                  Bénéficiez de notre intelligence artificielle citoyenne pour rédiger vos doléances, générer des textes convaincants en Wolof et Français et créer vos visuels de communication en quelques secondes.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FAQ */}
          {activeTab === 'faq' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'white', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <strong style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                  ❓ Comment puis-je faire certifier mon compte (KYC) ?
                </strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary-light)', lineHeight: '1.4' }}>
                  Rendez-vous dans votre <strong>Profil ➔ Passer le KYC</strong>. Téléversez le Recto et Verso de votre CNI ou Passeport. L'équipe valide votre identité sous 24h.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <strong style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                  ❓ Comment fonctionnent les retraits d'argent ?
                </strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary-light)', lineHeight: '1.4' }}>
                  Dans l'onglet <strong>Portefeuille</strong> de votre profil, indiquez le montant souhaité et votre numéro Wave ou Orange Money. Le virement est effectué directement sur votre téléphone.
                </p>
              </div>

              <div style={{ background: 'white', padding: '1.1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <strong style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.35rem' }}>
                  ❓ Comment démarrer ma propre tontine ou cagnotte ?
                </strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary-light)', lineHeight: '1.4' }}>
                  Cliquez sur le bouton vert <strong>+ Créer</strong> dans le menu principal ou laissez <strong>Lamine IA 🦁</strong> générer votre projet automatiquement pour vous.
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}
              onClick={onClose}
            >
              Fermer
            </button>
            
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}
              onClick={() => {
                onClose();
                if (onNavigate) onNavigate('create-hub');
              }}
            >
              🚀 Lancer un Projet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
