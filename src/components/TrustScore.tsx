import React, { useState } from 'react';

interface TrustScoreProps {
  score: number;
}

export const TrustScore: React.FC<TrustScoreProps> = ({ score }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTier = (s: number) => {
    if (s >= 95) return { name: 'Lion de la Teranga 🦁✨', class: 'trust-tier-diamant', desc: 'Confiance absolue. Identité certifiée, transparence totale et engagement citoyen exemplaire.' };
    if (s >= 85) return { name: 'Pilier Communautaire 🛡️💎', class: 'trust-tier-platine', desc: 'Niveau très élevé. Acteur majeur de l\'entraide, projets transparents et validés.' };
    if (s >= 70) return { name: 'Citoyen Certifié 🛡️👑', class: 'trust-tier-or', desc: 'Niveau élevé. Identité certifiée par CNI/Passeport et vérification biométrique.' };
    if (s >= 50) return { name: 'Citoyen Actif 🛡️🥈', class: 'trust-tier-argent', desc: 'Niveau modéré. Citoyen engagé participant régulièrement aux actions solidaires.' };
    return { name: 'Citoyen Initié 🛡️🥉', class: 'trust-tier-bronze', desc: 'Nouveau membre. Profil de base en attente de certification d\'identité.' };
  };

  const tier = getTier(score);

  // Dynamic breakdown estimation based on total score
  const identityScore = score >= 35 ? 35 : score;
  const docsScore = score >= 70 ? 35 : Math.max(0, score - 35);
  const activitiesScore = score >= 90 ? 20 : Math.max(0, score - 70);
  const extraScore = score >= 100 ? 10 : Math.max(0, score - 90);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className={`trust-tier ${tier.class}`} style={{ cursor: 'help' }}>
        {tier.name} ({score}%)
      </span>

      {showTooltip && (
        <div 
          className="glass animate-fade-in"
          style={{
            position: 'absolute',
            top: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            width: '280px',
            padding: '1.25rem 1rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'left',
            fontSize: '0.8rem',
            pointerEvents: 'none',
            background: 'var(--light-card)',
            border: '1.5px solid var(--border-light)',
            color: 'var(--text-primary-light)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.85rem' }}>Badge : {tier.name.split(' ')[0]}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-secondary-light)', fontStyle: 'italic', lineHeight: '1.3' }}>
              {tier.desc}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>👤 Identification KYC :</span>
              <strong>{identityScore}/35 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🪪 Pièce d'identité & Selfie :</span>
              <strong>{docsScore}/35 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>📈 Mobilisation (Dons/Signatures) :</span>
              <strong>{activitiesScore}/20 pts</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>🔄 Tontines & Chantiers :</span>
              <strong>{extraScore}/10 pts</strong>
            </div>
          </div>

          <div style={{ marginTop: '0.65rem', fontSize: '0.7rem', color: 'var(--text-secondary-light)', borderTop: '1px dashed var(--border-light)', paddingTop: '0.5rem', lineHeight: '1.3' }}>
            💡 <strong>Comment progresser ?</strong> Complétez votre profil, passez le KYC biométrique, signez des pétitions, faites des dons ou rejoignez des tontines pour élever votre badge de confiance !
          </div>
        </div>
      )}
    </div>
  );
};
