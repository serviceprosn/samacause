import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

interface Tontine {
  id: string;
  name: string;
  amount: number;
  participants: number;
  frequency: 'weekly' | 'monthly';
  status: 'active' | 'completed';
  joinedCount: number;
  members: string[];
  drawHistory: { round: number; date: string; winner: string; amount: number }[];
}

interface CreateHubProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CreateHub: React.FC<CreateHubProps> = ({ onNavigate }) => {
  const { currentUser, addNotification } = useApp();
  const { t } = useLanguage();
  const [showTontineModal, setShowTontineModal] = useState(false);
  const [expandedTontineId, setExpandedTontineId] = useState<string | null>(null);

  // Tontine creation states
  const [tontineName, setTontineName] = useState('');
  const [tontineAmount, setTontineAmount] = useState(10000);
  const [tontineParticipants, setTontineParticipants] = useState(10);
  const [tontineFrequency, setTontineFrequency] = useState<'weekly' | 'monthly'>('monthly');

  // Simulated active tontines list with members and draw history
  const [tontines, setTontines] = useState<Tontine[]>([
    {
      id: 'ton_1',
      name: 'Tontine Entraide Femmes Rufisque',
      amount: 5000,
      participants: 12,
      frequency: 'monthly',
      status: 'active',
      joinedCount: 8,
      members: ['Awa Cissé', 'Fatou Diop', 'Mariama Diallo', 'Khadija Sow', 'Aminata Ndiaye', 'Coumba Kane', 'Ouleye Seydi', 'Penda Ba'],
      drawHistory: []
    },
    {
      id: 'ton_2',
      name: 'Tontine Diaspora Louga Progrès',
      amount: 50000,
      participants: 8,
      frequency: 'monthly',
      status: 'active',
      joinedCount: 8,
      members: ['Mouhameth Sarr', 'Moussa Diagne', 'Cheikh Diallo', 'Ablaye Ndiaye', 'Demba Sy', 'Ibrahima Fall', 'Sokhna Wade', 'Pape Abdoulaye'],
      drawHistory: [
        { round: 1, date: '2026-05-01', winner: 'Moussa Diagne', amount: 400000 }
      ]
    }
  ]);

  // Drawing simulation states
  const [activeDrawTontine, setActiveDrawTontine] = useState<Tontine | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawWinner, setDrawWinner] = useState<string | null>(null);
  const [spinName, setSpinName] = useState<string>('');

  const handleCreateTontine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tontineName) {
      alert('Veuillez donner un nom à la tontine.');
      return;
    }

    const pool = ['Ndeye Diop', 'Ousmane Sow', 'Amadou Diallo', 'Khadim Kane', 'Codou Fall', 'Abdoulaye Wade', 'Birame Seck', 'Fama Ndiaye', 'Moustapha Cissé', 'Coumba Diagne'];
    const selectedMembers = [currentUser?.name || 'Vous'];
    const countToFill = Math.min(tontineParticipants - 1, pool.length);
    for (let i = 0; i < countToFill; i++) {
      selectedMembers.push(pool[i]);
    }

    const newTontine: Tontine = {
      id: `ton_${Math.random().toString(36).substr(2, 9)}`,
      name: tontineName,
      amount: tontineAmount,
      participants: tontineParticipants,
      frequency: tontineFrequency,
      status: 'active',
      joinedCount: selectedMembers.length,
      members: selectedMembers,
      drawHistory: []
    };

    setTontines(prev => [newTontine, ...prev]);
    addNotification(`Tontine "${tontineName}" créée et activée ! Invitation SMS envoyée aux participants.`);
    
    // Reset form & close modal
    setTontineName('');
    setTontineAmount(10000);
    setTontineParticipants(10);
    setTontineFrequency('monthly');
    setShowTontineModal(false);
  };

  const startDrawSimulation = (tontine: Tontine) => {
    setActiveDrawTontine(tontine);
    setIsDrawing(true);
    setDrawWinner(null);
    setSpinName(tontine.members[0] || '...');

    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      const randomIndex = Math.floor(Math.random() * tontine.members.length);
      setSpinName(tontine.members[randomIndex]);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      // Pick a winner who hasn't won yet in the current cycle, or random if all won
      const alreadyWon = tontine.drawHistory.map(h => h.winner);
      const remainingMembers = tontine.members.filter(m => !alreadyWon.includes(m));
      const pool = remainingMembers.length > 0 ? remainingMembers : tontine.members;
      const winner = pool[Math.floor(Math.random() * pool.length)];

      setDrawWinner(winner);
      setIsDrawing(false);

      // Save to tontine history
      setTontines(prev => prev.map(t => {
        if (t.id === tontine.id) {
          const round = t.drawHistory.length + 1;
          const pot = t.amount * t.joinedCount;
          return {
            ...t,
            drawHistory: [
              ...t.drawHistory,
              { round, date: new Date().toISOString().split('T')[0], winner, amount: pot }
            ]
          };
        }
        return t;
      }));

      addNotification(`🏆 ${winner} a remporté le tirage de la tontine "${tontine.name}" ! Pot de ${(tontine.amount * tontine.joinedCount).toLocaleString('fr-FR')} F.`);
    }, 3000);
  };

  return (
    <>
      <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('createhub.title')}</h1>
        <p style={{ color: 'var(--text-secondary-light)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          {t('createhub.subtitle')}
        </p>
      </div>

      {/* Grid of creation options */}
      <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '3rem' }}>
        {/* 1. PETITION */}
        <div 
          className="premium-card hover-glow" 
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => onNavigate('petitions', { view: 'create' })}
        >
          <span style={{ fontSize: '2.5rem' }}>✍️</span>
          <h3 style={{ fontWeight: 800 }}>{t('createhub.opt.petition_title')}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', flex: 1 }}>
            {t('createhub.opt.petition_desc')}
          </p>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}>
            {t('createhub.opt.petition_btn')}
          </button>
        </div>

        {/* 2. CAGNOTTE */}
        <div 
          className="premium-card hover-glow" 
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => onNavigate('cagnottes', { view: 'create' })}
        >
          <span style={{ fontSize: '2.5rem' }}>💰</span>
          <h3 style={{ fontWeight: 800 }}>{t('createhub.opt.cagnotte_title')}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', flex: 1 }}>
            {t('createhub.opt.cagnotte_desc')}
          </p>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}>
            {t('createhub.opt.cagnotte_btn')}
          </button>
        </div>

        {/* 3. PROJET EN COMMUN / BENEVOLAT */}
        <div 
          className="premium-card hover-glow" 
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => onNavigate('benevolat', { view: 'create' })}
        >
          <span style={{ fontSize: '2.5rem' }}>🛠️</span>
          <h3 style={{ fontWeight: 800 }}>{t('createhub.opt.volunteer_title')}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', flex: 1 }}>
            {t('createhub.opt.volunteer_desc')}
          </p>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}>
            {t('createhub.opt.volunteer_btn')}
          </button>
        </div>

        {/* 4. TONTINE CITOYENNE */}
        <div 
          className="premium-card hover-glow" 
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => onNavigate('tontines')}
        >
          <span style={{ fontSize: '2.5rem' }}>🔄</span>
          <h3 style={{ fontWeight: 800 }}>{t('createhub.opt.tontine_title')}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary-light)', flex: 1 }}>
            {t('createhub.opt.tontine_desc')}
          </p>
          <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}>
            {t('createhub.opt.tontine_btn')}
          </button>
        </div>
      </div>

      {/* Active Tontines Simulation Section */}
      <div className="premium-card" style={{ background: 'var(--light)' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('createhub.tontines.title')}</span>
          <button 
            className="btn btn-outline" 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-sm)' }}
            onClick={() => setShowTontineModal(true)}
          >
            {t('createhub.tontines.new')}
          </button>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tontines.map((tVal) => {
            const isExpanded = expandedTontineId === tVal.id;
            const progress = Math.min(100, Math.round((tVal.joinedCount / tVal.participants) * 100));
            return (
              <div 
                key={tVal.id} 
                className="premium-card hover-glow" 
                style={{ 
                  background: 'var(--light-card)', 
                  padding: '1.25rem',
                  border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border-light)'
                }}
              >
                {/* Header elements always visible */}
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedTontineId(isExpanded ? null : tVal.id)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <strong style={{ fontSize: '1rem' }}>{tVal.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
                      {t('createhub.tontines.members_prefix')}{tVal.joinedCount} / {tVal.participants} {t('createhub.tontines.members_inscribed')} | {t('createhub.tontines.freq_label')}{tVal.frequency === 'weekly' ? t('createhub.tontines.freq_weekly') : t('createhub.tontines.freq_monthly')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                      {tVal.amount.toLocaleString('fr-FR')} F / {tVal.frequency === 'weekly' ? 'sem' : 'mois'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Progress bar always visible */}
                <div style={{ width: '100%', height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden', marginTop: '0.75rem' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '3px' }} />
                </div>

                {/* Expanded Section Details */}
                {isExpanded && (
                  <div className="animate-slide-up" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                    {/* Circle Members */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>👥 {t('createhub.tontines.members_prefix')}({tVal.members.length}) :</strong>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {tVal.members.map((member, i) => (
                          <span 
                            key={i} 
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.25rem 0.6rem', 
                              borderRadius: '20px', 
                              background: 'var(--light)', 
                              border: '1px solid var(--border-light)',
                              fontWeight: 600
                            }}
                          >
                            👤 {member}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* History grid */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>📋 {t('createhub.tontines.hist_title')}</strong>
                      {tVal.drawHistory.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary-light)', fontStyle: 'italic' }}>
                          {t('createhub.tontines.hist_none')}
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {tVal.drawHistory.map((h, i) => (
                            <div 
                              key={i} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                padding: '0.4rem 0.75rem', 
                                background: 'rgba(0,133,63,0.03)', 
                                border: '1px solid rgba(0,133,63,0.1)', 
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.8rem'
                              }}
                            >
                              <span>📅 {t('createhub.tontines.hist_round')} {h.round} ({h.date})</span>
                              <span>{t('createhub.tontines.hist_winner')} <strong style={{ color: 'var(--primary)' }}>{h.winner}</strong> (+{h.amount.toLocaleString('fr-FR')} F)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Trigger Button */}
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={() => startDrawSimulation(tVal)}
                    >
                      🎰 {t('createhub.tontines.draw_btn')} ({tVal.drawHistory.length + 1})
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      </div>

      {/* TONTINE CREATION MODAL */}
      {showTontineModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
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
              maxWidth: '440px',
              background: 'var(--light-card)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.2rem' }}>🔄 {t('createhub.modal.title')}</h3>
              <button 
                className="btn btn-ghost" 
                style={{ padding: '0.2rem 0.4rem', minWidth: 'auto' }} 
                onClick={() => setShowTontineModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTontine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('createhub.modal.name')}</label>
                <input 
                  type="text" 
                  required
                  placeholder={t('createhub.modal.name_placeholder')}
                  className="premium-card" 
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)' }}
                  value={tontineName}
                  onChange={(e) => setTontineName(e.target.value)}
                />
              </div>

              <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('createhub.modal.amount')}</label>
                  <select 
                    className="premium-card"
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
                    value={tontineAmount}
                    onChange={(e) => setTontineAmount(parseInt(e.target.value, 10))}
                  >
                    <option value={5000}>5 000 F</option>
                    <option value={10000}>10 000 F</option>
                    <option value={25000}>25 000 F</option>
                    <option value={50000}>5 0000 F</option>
                    <option value={100000}>100 000 F</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('createhub.modal.frequency')}</label>
                  <select 
                    className="premium-card"
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--light)', borderRadius: 'var(--radius-sm)' }}
                    value={tontineFrequency}
                    onChange={(e: any) => setTontineFrequency(e.target.value)}
                  >
                    <option value="weekly">{t('createhub.tontines.freq_weekly')}</option>
                    <option value="monthly">{t('createhub.tontines.freq_monthly')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{t('createhub.modal.participants')}</label>
                <input 
                  type="number" 
                  required
                  min={2}
                  max={50}
                  className="premium-card" 
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--light)' }}
                  value={tontineParticipants}
                  onChange={(e) => setTontineParticipants(parseInt(e.target.value, 10))}
                />
              </div>

              <div style={{ background: 'rgba(0,133,63,0.05)', border: '1px dashed var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary-light)', lineHeight: 1.4 }}>
                {t('createhub.modal.hint')}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowTontineModal(false)}>
                  {t('createhub.modal.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  {t('createhub.modal.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TONTINE DRAW ANIMATION MODAL */}
      {activeDrawTontine && isDrawing && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div 
            className="glass" 
            style={{
              width: '100%',
              maxWidth: '380px',
              background: 'radial-gradient(circle, var(--light-card) 0%, var(--light) 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 1.5rem',
              boxShadow: 'var(--shadow-lg)',
              textAlign: 'center',
              border: '2px solid var(--primary)'
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', animation: 'float 2s infinite' }}>🎰</span>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>{t('createhub.draw.title')}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)', marginBottom: '2rem' }}>
              {t('createhub.draw.desc')} **{activeDrawTontine.name}**
            </p>

            {/* Spinning names display */}
            <div 
              style={{ 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'var(--dark)', 
                color: 'var(--secondary)', 
                fontSize: '1.6rem', 
                fontWeight: 900, 
                borderRadius: 'var(--radius-md)',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)',
                letterSpacing: '1px',
                border: '1px solid var(--border-light)',
                textTransform: 'uppercase',
                overflow: 'hidden'
              }}
            >
              <div className="animate-pulse">{spinName}</div>
            </div>

            <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary-light)' }}>
              ⚡ {t('createhub.draw.pot')} <strong>{(activeDrawTontine.amount * activeDrawTontine.joinedCount).toLocaleString('fr-FR')} FCFA</strong>
            </div>
          </div>
        </div>
      )}

      {/* TONTINE WINNER ANNOUNCEMENT MODAL */}
      {activeDrawTontine && drawWinner && (
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
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '0.5rem' }}>🎉</span>
            <h3 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary)' }}>{t('createhub.winner.congrats')}</h3>
            
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
                {drawWinner.substring(0, 2).toUpperCase()}
              </div>
              <strong style={{ fontSize: '1.3rem', display: 'block', color: 'var(--text-primary-light)' }}>{drawWinner}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary-light)' }}>
                {t('createhub.winner.sub')}
              </span>
            </div>

            <div style={{ background: 'rgba(0,133,63,0.05)', border: '1px solid var(--primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {t('createhub.winner.gain')} <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{(activeDrawTontine.amount * activeDrawTontine.joinedCount).toLocaleString('fr-FR')} FCFA</strong>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.65rem' }} 
              onClick={() => {
                setDrawWinner(null);
                setActiveDrawTontine(null);
              }}
            >
              {t('createhub.winner.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default CreateHub;
